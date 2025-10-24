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
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      throw error
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

// Get all jobs a user has applied to with full details
export async function getUserAppliedJobs(userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        status,
        jobs!inner (
          id,
          job_title,
          job_type,
          company_name,
          company_logo,
          location,
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
      job: {
        id: app.jobs?.id || '',
        job_title: app.jobs?.job_title || '',
        job_type: app.jobs?.job_type || '',
        company_name: app.jobs?.company_name || '',
        company_logo: app.jobs?.company_logo || '',
        location: app.jobs?.location || '',
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