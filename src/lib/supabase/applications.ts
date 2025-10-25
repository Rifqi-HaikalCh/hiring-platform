import { supabase } from './client'

export interface Application {
  id: string
  job_id: string
  applicant_id: string // Updated to match actual table structure
  application_data: any // JSONB field containing candidate information
  status: 'submitted' | 'pending' | 'accepted' | 'rejected' // Added 'submitted' as default
  created_at: string
}

export interface CandidateData {
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  domicile?: string
  gender?: string
  linkedin_url?: string
  [key: string]: any // For additional fields that might exist
}

export async function getApplicationsByJobId(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get applications by job ID error:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        rawError: error
      })
      throw error
    }

    return { data: data as Application[], error: null }
  } catch (error: any) {
    console.error('Get applications by job ID error:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      rawError: error
    })
    return { data: null, error }
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'accepted' | 'rejected'
) {
  try {
    // Get application data with job info before updating
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner (
          id,
          job_title
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Update status
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Send notification to candidate
    if (application && application.applicant_id && application.jobs) {
      const { notifyApplicationStatusChange } = await import('./notifications')
      await notifyApplicationStatusChange(
        application.applicant_id,
        applicationId,
        application.job_id,
        application.jobs.job_title,
        status
      )
    }

    return { data: data as Application, error: null }
  } catch (error) {
    console.error('Update application status error:', error)
    return { data: null, error }
  }
}

export async function deleteApplication(applicationId: string) {
  try {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Delete application error:', error)
    return { error }
  }
}

// Helper function to safely extract candidate data from JSONB
export function extractCandidateData(applicationData: any): CandidateData {
  if (!applicationData || typeof applicationData !== 'object') {
    return {}
  }

  return {
    full_name: applicationData.full_name || applicationData.fullName || '',
    email: applicationData.email || '',
    phone: applicationData.phone_number || applicationData.phone || '', // Fixed: check phone_number first
    date_of_birth: applicationData.date_of_birth || applicationData.dateOfBirth || '',
    domicile: applicationData.domicile || applicationData.address || '',
    gender: applicationData.gender || '',
    linkedin_url: applicationData.linkedin_link || applicationData.linkedin_url || applicationData.linkedinUrl || applicationData.linkedin || '', // Fixed: check linkedin_link first
  }
}

// Check if user has already applied to a job
export async function checkIfApplied(jobId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Check if applied error:', error)
      throw error
    }

    return { hasApplied: !!data, error: null }
  } catch (error) {
    console.error('Check if applied error:', error)
    return { hasApplied: false, error }
  }
}

// Get all applied job IDs for a user
export async function getUserAppliedJobIds(userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('job_id')
      .eq('applicant_id', userId)

    if (error) {
      console.error('Get applied job IDs error:', error)
      throw error
    }

    const jobIds = data?.map(app => app.job_id) || []
    return { data: jobIds, error: null }
  } catch (error) {
    console.error('Get applied job IDs error:', error)
    return { data: [], error }
  }
}

// Get application statuses for all jobs a user has applied to
export async function getUserApplicationStatuses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('job_id, status')
      .eq('applicant_id', userId)

    if (error) {
      console.error('Get application statuses error:', error)
      throw error
    }

    // Create a map of job_id to status
    const statusMap: Record<string, 'submitted' | 'pending' | 'accepted' | 'rejected'> = {}
    data?.forEach(app => {
      if (app.job_id && app.status) {
        statusMap[app.job_id] = app.status as 'submitted' | 'pending' | 'accepted' | 'rejected'
      }
    })

    return { data: statusMap, error: null }
  } catch (error) {
    console.error('Get application statuses error:', error)
    return { data: {}, error }
  }
}

// Get count of accepted applications for a job
export async function getAcceptedApplicationsCount(jobId: string) {
  try {
    const { data, error, count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('status', 'accepted')

    if (error) {
      console.error('Get accepted count error:', error)
      throw error
    }

    console.log(`[getAcceptedApplicationsCount] Job ${jobId}: ${count || 0} accepted applications`)
    return { data: count || 0, error: null }
  } catch (error) {
    console.error('Get accepted count error:', error)
    return { data: 0, error }
  }
}

// Check and auto-deactivate job if candidates needed is met
export async function checkAndDeactivateJobIfFull(jobId: string) {
  try {
    // Get job details directly from database to avoid circular dependency
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Failed to get job:', jobError)
      return { success: false, error: jobError }
    }

    // Get accepted count
    const { data: acceptedCount, error: countError } = await getAcceptedApplicationsCount(jobId)
    if (countError) {
      console.error('Failed to get accepted count:', countError)
      return { success: false, error: countError }
    }

    console.log(`Checking job ${jobId}: ${acceptedCount}/${job.candidates_needed} accepted, status: ${job.status}`)

    // Check if job should be deactivated
    if (acceptedCount >= job.candidates_needed && job.status === 'active') {
      // Update job status directly
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'inactive' })
        .eq('id', jobId)

      if (updateError) {
        console.error('Failed to deactivate job:', updateError)
        return { success: false, error: updateError }
      }

      console.log(`Job ${jobId} auto-deactivated: ${acceptedCount}/${job.candidates_needed} candidates accepted`)
      return { success: true, deactivated: true, message: 'Job auto-deactivated as candidates needed quota is met' }
    }

    return { success: true, deactivated: false }
  } catch (error) {
    console.error('Check and deactivate job error:', error)
    return { success: false, error }
  }
}

// Get all jobs a user has applied to with full details
export async function getUserAppliedJobs(userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        status,
        application_data,
        jobs!inner (
          id,
          job_title,
          job_type,
          job_description,
          company_name,
          company_logo_url,
          location,
          department,
          required_skills,
          min_salary,
          max_salary,
          status
        )
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get user applied jobs error:', error)
      throw error
    }

    // Transform data to flatten structure
    // Supabase returns jobs as an object (not array) when using !inner
    const transformedData = data?.map((app: any) => ({
      id: app.id,
      job_id: app.jobs?.id || '',
      status: app.status,
      created_at: app.created_at,
      application_data: app.application_data,
      job: {
        id: app.jobs?.id || '',
        job_title: app.jobs?.job_title || '',
        job_type: app.jobs?.job_type || '',
        job_description: app.jobs?.job_description || '',
        company_name: app.jobs?.company_name || '',
        company_logo: app.jobs?.company_logo_url || '',
        location: app.jobs?.location || '',
        department: app.jobs?.department || '',
        required_skills: app.jobs?.required_skills || [],
        min_salary: app.jobs?.min_salary || 0,
        max_salary: app.jobs?.max_salary || 0,
        status: app.jobs?.status || ''
      }
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Get user applied jobs error:', error)
    return { data: null, error }
  }
}