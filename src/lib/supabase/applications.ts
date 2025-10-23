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
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Get applications by job ID error:', error)
      throw error
    }

    return { data: data as Application[], error: null }
  } catch (error) {
    console.error('Get applications by job ID error:', error)
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