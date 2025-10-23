'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated?: () => void
}

interface JobFormData {
  job_title: string
  job_type: string
  job_description: string
  candidates_needed: number
  min_salary: string
  max_salary: string
}

type RequirementState = 'mandatory' | 'optional' | 'off'

interface FormConfiguration {
  full_name: RequirementState
  photo_profile: RequirementState
  gender: RequirementState
  domicile: RequirementState
  email: RequirementState
  phone_number: RequirementState
  linkedin_link: RequirementState
  date_of_birth: RequirementState
}

const defaultFormConfig: FormConfiguration = {
  full_name: 'mandatory',
  photo_profile: 'mandatory',
  gender: 'mandatory',
  domicile: 'mandatory',
  email: 'mandatory',
  phone_number: 'mandatory',
  linkedin_link: 'mandatory',
  date_of_birth: 'mandatory'
}

const jobTypes = [
  'Full-time',
  'Contract',
  'Part-time',
  'Internship',
  'Freelance'
]

const profileFields = [
  { key: 'full_name', label: 'Full name' },
  { key: 'photo_profile', label: 'Photo Profile' },
  { key: 'gender', label: 'Gender' },
  { key: 'domicile', label: 'Domicile' },
  { key: 'email', label: 'Email' },
  { key: 'phone_number', label: 'Phone number' },
  { key: 'linkedin_link', label: 'Linkedin link' },
  { key: 'date_of_birth', label: 'Date of birth' }
]

// Utility function to clean salary input (remove 'Rp' and dots)
const cleanSalaryString = (salaryStr: string): number => {
  return parseInt(salaryStr.replace(/[^\d]/g, '')) || 0
}

// Utility function to format number with dots
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '')
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface RequirementToggleProps {
  value: RequirementState
  onChange: (value: RequirementState) => void
}

function RequirementToggle({ value, onChange }: RequirementToggleProps) {
  const options: { value: RequirementState; label: string; style: string }[] = [
    { value: 'mandatory', label: 'Mandatory', style: 'border-teal-600 bg-teal-50 text-teal-700' },
    { value: 'optional', label: 'Optional', style: 'border-yellow-600 bg-yellow-50 text-yellow-700' },
    { value: 'off', label: 'Off', style: 'border-gray-300 bg-gray-50 text-gray-500' }
  ]

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-2 py-1 text-xs font-medium rounded transition-all ${
            value === option.value
              ? option.style
              : 'border border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function CreateJobModal({ isOpen, onClose, onJobCreated }: CreateJobModalProps) {
  const [formConfig, setFormConfig] = useState<FormConfiguration>(defaultFormConfig)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<JobFormData>({
    mode: 'onChange',
    defaultValues: {
      job_title: '',
      job_type: 'Full-time',
      job_description: '',
      candidates_needed: 1,
      min_salary: '',
      max_salary: ''
    }
  })

  const minSalary = watch('min_salary')
  const maxSalary = watch('max_salary')

  const handleSalaryChange = (field: 'min_salary' | 'max_salary', value: string) => {
    const formatted = formatCurrency(value)
    setValue(field, formatted, { shouldValidate: true })
  }

  const handleRequirementChange = (field: keyof FormConfiguration, value: RequirementState) => {
    setFormConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const onSubmit = async (data: JobFormData) => {
    try {
      setLoading(true)

      // Debug: Log form data
      console.log('Form data:', data)

      // Get current user with detailed logging
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      console.log('User auth result:', { user, userError })
      console.log('User ID:', user?.id)
      console.log('User metadata:', user?.user_metadata)

      if (userError) {
        console.error('Auth error:', userError)
        toast.error(`Authentication error: ${userError.message}`)
        return
      }

      if (!user) {
        console.error('No user found')
        toast.error('No authenticated user found')
        return
      }

      // Check current session
      const { data: session } = await supabase.auth.getSession()
      console.log('Current session:', session)

      // Prepare job data with validation
      const jobData = {
        job_title: data.job_title?.trim(),
        job_type: data.job_type,
        job_description: data.job_description?.trim(),
        candidates_needed: parseInt(data.candidates_needed.toString()) || 1,
        min_salary: cleanSalaryString(data.min_salary),
        max_salary: cleanSalaryString(data.max_salary),
        created_by: user.id, // Ensure this is the authenticated user
        status: 'active',
        form_configuration: formConfig
      }

      console.log('Job data to insert:', jobData)

      // Validate required fields
      if (!jobData.job_title) {
        toast.error('Job title is required')
        return
      }

      if (!jobData.created_by) {
        toast.error('User authentication error - no user ID')
        return
      }

      // Test RLS by checking if we can read from jobs table first
      console.log('Testing read access to jobs table...')
      const { data: testRead, error: readError } = await supabase
        .from('jobs')
        .select('id')
        .limit(1)

      console.log('Read test result:', { testRead, readError })

      // Insert job into Supabase with better error handling
      console.log('Attempting to insert job...')
      const { data: jobResult, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single()

      console.log('Insert result:', { jobResult, error })

      if (error) {
        console.error('Job creation error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })

        // Provide more specific error messages
        if (error.code === '42501') {
          toast.error('Permission denied. Please check if you have admin privileges and RLS policies are set up correctly.')
        } else {
          toast.error(`Failed to create job: ${error.message}`)
        }
        return
      }

      console.log('Job created successfully:', jobResult)
      toast.success('Job published successfully!')

      // Reset form and close modal
      reset()
      setFormConfig(defaultFormConfig)
      onClose()

      // Callback to refresh job list
      if (onJobCreated) {
        onJobCreated()
      }

    } catch (error) {
      console.error('Unexpected error during job creation:', error)
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      setFormConfig(defaultFormConfig)
      onClose()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl h-[1080px] transform rounded-2xl bg-white text-left align-middle shadow-xl transition-all overflow-hidden flex flex-col">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Job Opening
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <form id="job-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                  {/* Section 1: Job Details */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Job Details</h3>

                    {/* Job Name */}
                    <div>
                      <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
                        Job Name *
                      </label>
                      <Input
                        id="job_title"
                        placeholder="Ex. Front End Engineer"
                        {...register('job_title', { required: 'Job name is required' })}
                        error={!!errors.job_title}
                      />
                      {errors.job_title && (
                        <p className="text-sm text-red-600 mt-1">{errors.job_title.message}</p>
                      )}
                    </div>

                    {/* Job Type */}
                    <div>
                      <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Job Type *
                      </label>
                      <select
                        id="job_type"
                        {...register('job_type', { required: 'Job type is required' })}
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      >
                        {jobTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job Description */}
                    <div>
                      <label htmlFor="job_description" className="block text-sm font-medium text-gray-700 mb-1">
                        Job Description *
                      </label>
                      <textarea
                        id="job_description"
                        rows={4}
                        placeholder="Ex. Develop user interfaces, collaborate with design team..."
                        {...register('job_description', { required: 'Job description is required' })}
                        className={`flex w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
                          errors.job_description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.job_description && (
                        <p className="text-sm text-red-600 mt-1">{errors.job_description.message}</p>
                      )}
                    </div>

                    {/* Number of Candidates */}
                    <div>
                      <label htmlFor="candidates_needed" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Candidate Needed *
                      </label>
                      <Input
                        id="candidates_needed"
                        type="number"
                        min="1"
                        placeholder="Ex. 2"
                        {...register('candidates_needed', {
                          required: 'Number of candidates is required',
                          min: { value: 1, message: 'Must be at least 1' }
                        })}
                        error={!!errors.candidates_needed}
                      />
                      {errors.candidates_needed && (
                        <p className="text-sm text-red-600 mt-1">{errors.candidates_needed.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Salary */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Salary Range</h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Minimum Salary */}
                      <div>
                        <label htmlFor="min_salary" className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Estimated Salary
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            Rp
                          </span>
                          <input
                            id="min_salary"
                            type="text"
                            value={minSalary}
                            onChange={(e) => handleSalaryChange('min_salary', e.target.value)}
                            placeholder="5.000.000"
                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Maximum Salary */}
                      <div>
                        <label htmlFor="max_salary" className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Estimated Salary
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            Rp
                          </span>
                          <input
                            id="max_salary"
                            type="text"
                            value={maxSalary}
                            onChange={(e) => handleSalaryChange('max_salary', e.target.value)}
                            placeholder="8.000.000"
                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Profile Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Minimum Profile Information Required</h3>

                    <div className="space-y-3">
                      {profileFields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{field.label}</span>
                          <RequirementToggle
                            value={formConfig[field.key as keyof FormConfiguration]}
                            onChange={(value) => handleRequirementChange(field.key as keyof FormConfiguration, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  </form>
                </div>

                {/* Fixed Footer */}
                <div className="border-t border-gray-200 p-6 flex-shrink-0">
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      form="job-form"
                      disabled={!isValid || loading}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      {loading ? 'Publishing...' : 'Publish Job'}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}