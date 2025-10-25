import { supabase } from './client'

export interface Job {
  id: string
  job_title: string
  job_type: string
  job_description: string
  candidates_needed: number
  min_salary: number
  max_salary: number
  status: 'active' | 'inactive' | 'draft'
  form_configuration: any
  created_at: string
  created_by?: string
  // New fields for enhanced display
  company_name?: string
  company_logo?: string
  location?: string
  department?: string
  // Legacy fields for compatibility
  title?: string
  company?: string
  salary_min?: number
  salary_max?: number
  description?: string[]
}

export interface JobApplication {
  id: string
  job_id: string
  candidate_id: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
}

export async function getJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get jobs error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    return { data: data as Job[], error: null }
  } catch (error: any) {
    console.error('Get jobs error:', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    return { data: null, error }
  }
}

export async function getJobById(id: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get job by ID error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        jobId: id
      })
      throw error
    }

    return { data: data as Job, error: null }
  } catch (error: any) {
    console.error('Get job error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack,
      jobId: id
    })
    return { data: null, error }
  }
}

export async function createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single()

    if (error) {
      console.error('Create job error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    return { data: data as Job, error: null }
  } catch (error: any) {
    console.error('Create job error:', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    return { data: null, error }
  }
}

export async function applyToJob(jobId: string, candidateId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          candidate_id: candidateId,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data: data as JobApplication, error: null }
  } catch (error) {
    console.error('Apply to job error:', error)
    return { data: null, error }
  }
}

export async function getUserApplications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (*)
      `)
      .eq('candidate_id', userId)
      .order('applied_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get applications error:', error)
    return { data: null, error }
  }
}

export async function updateJob(jobId: string, updates: Partial<Job>) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      console.error('Update job error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        jobId
      })
      throw error
    }

    return { data: data as Job, error: null }
  } catch (error: any) {
    console.error('Update job error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      jobId
    })
    return { data: null, error }
  }
}

export async function updateJobStatus(jobId: string, newStatus: 'active' | 'inactive' | 'draft') {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      console.error('Update job status error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        jobId,
        newStatus
      })
      throw error
    }

    return { data: data as Job, error: null }
  } catch (error: any) {
    console.error('Update job status error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      jobId,
      newStatus
    })
    return { data: null, error }
  }
}

export async function deleteJob(jobId: string) {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.error('Delete job error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        jobId
      })
      throw error
    }

    return { error: null }
  } catch (error: any) {
    console.error('Delete job error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      jobId
    })
    return { error }
  }
}