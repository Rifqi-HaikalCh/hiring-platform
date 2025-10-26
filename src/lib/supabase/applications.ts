import { supabase } from './client'
import { notifyApplicationStatusChange } from './notifications';

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
    // First, update the status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select('*, jobs (id, job_title, company_name)')
      .single();

    if (updateError) {
      console.error('Update application status error:', updateError);
      throw updateError;
    }

    if (!updatedApplication) {
      throw new Error('Application not found after update.');
    }

    // Then, send the notification using the data from the update response
    const jobInfo = updatedApplication.jobs;
    if (jobInfo && updatedApplication.applicant_id) {
      try {
        await notifyApplicationStatusChange(
          updatedApplication.applicant_id,
          applicationId,
          updatedApplication.job_id,
          jobInfo.job_title,
          jobInfo.company_name || 'a company',
          status
        );
      } catch (notificationError) {
        console.error('Error sending application status change notification:', notificationError);
        // Decide whether to re-throw or just log the notification error
        // For now, we'll just log it so the status update itself still succeeds.
      }
    }

    return { data: updatedApplication as Application, error: null };
  } catch (error) {
    console.error('General error in updateApplicationStatus:', error);
    return { data: null, error };
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

export async function checkAndDeactivateJobIfFull(jobId: string) {
  try {
    console.log(`[checkAndDeactivateJobIfFull] Starting check for job: ${jobId}`);

    // Get job details... (kode tetap sama)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, candidates_needed, status') // Ambil hanya kolom yang diperlukan
      .eq('id', jobId)
      .single();

    if (jobError || !job) { /* ... logging error ... */ return { success: false, error: jobError }; }
    console.log(`[checkAndDeactivateJobIfFull] Job details fetched:`, job);

    // Get accepted count... (kode tetap sama)
    const { data: acceptedCount, error: countError } = await getAcceptedApplicationsCount(jobId);
    if (countError) { /* ... logging error ... */ return { success: false, error: countError }; }
    console.log(`[checkAndDeactivateJobIfFull] Accepted count for job ${jobId}: ${acceptedCount}`);

    console.log(`[checkAndDeactivateJobIfFull] Checking condition: ${acceptedCount} >= ${job.candidates_needed} && ${job.status} === 'active'`);

    // Check if job should be deactivated
    if (acceptedCount >= job.candidates_needed && job.status === 'active') {
      console.log(`[checkAndDeactivateJobIfFull] Condition met. Attempting to deactivate job ${jobId}...`);

      // Update job status directly
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'inactive' })
        .eq('id', jobId); // Targetkan update ke job ID yang benar

      // ---> Tambahkan Log Error Spesifik Di Sini <---
      if (updateError) {
        console.error(`[checkAndDeactivateJobIfFull] FAILED TO UPDATE job status for ${jobId}:`, updateError); // Log error update
        // Anda bisa melempar error di sini jika perlu penanganan lebih lanjut
        // throw updateError;
        return { success: false, error: updateError };
      }
      // ----------------------------------------------

      console.log(`[checkAndDeactivateJobIfFull] Job ${jobId} successfully auto-deactivated.`);
      return { success: true, deactivated: true, message: 'Job auto-deactivated as candidates needed quota is met' };
    } else {
        console.log(`[checkAndDeactivateJobIfFull] Condition not met for job ${jobId}. Status remains ${job.status}.`);
    }

    return { success: true, deactivated: false };
  } catch (error) {
    console.error(`[checkAndDeactivateJobIfFull] Unexpected error for job ${jobId}:`, error);
    return { success: false, error };
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