'use client'

import { useState, Fragment, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { X, Briefcase, DollarSign, Users, Sparkles, MapPin, Building2, Upload, Image as ImageIcon, Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'
import { gsap } from 'gsap'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated?: () => void
}

interface JobFormData {
  job_title: string
  job_type: string
  job_description: string
  company_name: string
  company_logo: string
  location: string
  required_skills: string
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

const cleanSalaryString = (salaryStr: string): number => {
  return parseInt(salaryStr.replace(/[^\d]/g, '')) || 0
}

const formatCurrency = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '')
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface RequirementToggleProps {
  value: RequirementState
  onChange: (value: RequirementState) => void
}

function RequirementToggle({ value, onChange }: RequirementToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const options: { value: RequirementState; label: string; color: string }[] = [
    { value: 'mandatory', label: 'Mandatory', color: 'from-teal-500 to-teal-600' },
    { value: 'optional', label: 'Optional', color: 'from-yellow-500 to-yellow-600' },
    { value: 'off', label: 'Off', color: 'from-gray-400 to-gray-500' }
  ]

  const handleClick = (newValue: RequirementState) => {
    onChange(newValue)

    // Ripple effect
    if (containerRef.current) {
      const ripple = document.createElement('div')
      ripple.className = 'absolute inset-0 bg-white/30 rounded-lg'
      containerRef.current.appendChild(ripple)

      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      )
    }
  }

  return (
    <div ref={containerRef} className="relative flex space-x-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-1 shadow-inner">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleClick(option.value)}
          className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
            value === option.value
              ? `bg-gradient-to-br ${option.color} text-white shadow-lg shadow-${option.color.split('-')[1]}-500/30 scale-105`
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      company_name: '',
      company_logo: '',
      location: '',
      required_skills: '',
      candidates_needed: 1,
      min_salary: '',
      max_salary: ''
    }
  })

  const minSalary = watch('min_salary')
  const maxSalary = watch('max_salary')

  useEffect(() => {
    if (isOpen && formRef.current) {
      // Animate form sections on open
      const sections = formRef.current.querySelectorAll('.form-section')
      gsap.fromTo(sections,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out'
        }
      )
    }
  }, [isOpen])

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('File size must be less than 2MB')
        return
      }

      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: JobFormData) => {
    try {
      setLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Authentication error')
        return
      }

      // Upload logo if exists
      let logoUrl: string | null = null
      if (logoFile) {
        try {
          const fileExtension = logoFile.name.split('.').pop()
          const fileName = `${data.company_name.replace(/\s+/g, '-')}-${Date.now()}.${fileExtension}`
          const filePath = `public/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('company_logos')
            .upload(filePath, logoFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Logo upload error:', uploadError)
            toast.error('Failed to upload company logo')
            return
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('company_logos')
            .getPublicUrl(filePath)

          logoUrl = publicUrl
        } catch (error) {
          console.error('Error during logo upload:', error)
          toast.error('An error occurred while uploading logo')
          return
        }
      }

      // Parse required skills
      const skillsArray = data.required_skills
        ? data.required_skills
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0)
        : []

      const jobData = {
        job_title: data.job_title?.trim(),
        job_type: data.job_type,
        job_description: data.job_description?.trim(),
        company_name: data.company_name?.trim(),
        location: data.location?.trim(),
        company_logo: logoUrl,
        required_skills: skillsArray,
        candidates_needed: parseInt(data.candidates_needed.toString()) || 1,
        min_salary: cleanSalaryString(data.min_salary),
        max_salary: cleanSalaryString(data.max_salary),
        created_by: user.id,
        status: 'active',
        form_configuration: formConfig
      }

      if (!jobData.job_title || !jobData.company_name || !jobData.location) {
        toast.error('Please fill in all required fields')
        return
      }

      const { error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single()

      if (error) {
        if (error.code === '42501') {
          toast.error('Permission denied. Please check your admin privileges.')
        } else {
          toast.error(`Failed to create job: ${error.message}`)
        }
        return
      }

      toast.success('Job published successfully!')

      reset()
      setFormConfig(defaultFormConfig)
      setLogoFile(null)
      setLogoPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()

      if (onJobCreated) {
        onJobCreated()
      }

    } catch (error) {
      console.error('Unexpected error during job creation:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      setFormConfig(defaultFormConfig)
      setLogoFile(null)
      setLogoPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-90 rotate-3"
              enterTo="opacity-100 scale-100 rotate-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 rotate-0"
              leaveTo="opacity-0 scale-90 rotate-3"
            >
              <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] transform rounded-3xl bg-white/70 backdrop-blur-xl text-left align-middle shadow-2xl shadow-black/10 transition-all overflow-hidden flex flex-col border border-white/20">
                {/* Header with gradient */}
                <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 text-white flex-shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold">
                        Create Job Opening
                      </Dialog.Title>
                      <p className="text-teal-100 text-sm">Fill in the details below</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="relative p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div ref={formRef} className="flex-1 overflow-y-auto custom-scrollbar">
                  <form id="job-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                    {/* Section 1: Job Details */}
                    <div className="form-section space-y-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Job Details
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="group">
                          <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="job_title"
                            placeholder="e.g., Senior Full Stack Developer"
                            {...register('job_title', { required: 'Job title is required' })}
                            error={!!errors.job_title}
                            className="transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          />
                          {errors.job_title && (
                            <p className="text-sm text-red-600 mt-1 animate-pulse">{errors.job_title.message}</p>
                          )}
                        </div>

                        <div className="group">
                          <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="job_type"
                            {...register('job_type', { required: 'Job type is required' })}
                            className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          >
                            {jobTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div className="group">
                          <label htmlFor="job_description" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="job_description"
                            rows={4}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            {...register('job_description', { required: 'Job description is required' })}
                            className={`flex w-full rounded-xl border px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02] ${
                              errors.job_description ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.job_description && (
                            <p className="text-sm text-red-600 mt-1 animate-pulse">{errors.job_description.message}</p>
                          )}
                        </div>

                        <div className="group">
                          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="company_name"
                            placeholder="Ex. TechCorp Indonesia"
                            {...register('company_name', { required: 'Company name is required' })}
                            error={!!errors.company_name}
                            className="transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          />
                          {errors.company_name && (
                            <p className="text-sm text-red-600 mt-1 animate-pulse">{errors.company_name.message}</p>
                          )}
                        </div>

                        <div className="group">
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Location <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="location"
                            placeholder="Ex. Jakarta Selatan - DKI Jakarta"
                            {...register('location', { required: 'Location is required' })}
                            error={!!errors.location}
                            className="transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          />
                          {errors.location && (
                            <p className="text-sm text-red-600 mt-1 animate-pulse">{errors.location.message}</p>
                          )}
                        </div>

                        <div className="group">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <ImageIcon className="h-4 w-4 inline mr-1" />
                            Company Logo (Optional)
                          </label>

                          {logoPreview ? (
                            <div className="relative w-full p-4 border-2 border-dashed border-teal-300 rounded-xl bg-teal-50/50 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-teal-200 shadow-md">
                                  <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">{logoFile?.name}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {logoFile && (logoFile.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-105"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                                id="logo-upload"
                              />
                              <label
                                htmlFor="logo-upload"
                                className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 group"
                              >
                                <Upload className="h-10 w-10 text-gray-400 group-hover:text-teal-500 transition-colors mb-2" />
                                <p className="text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                                  Click to upload logo
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="group">
                          <label htmlFor="required_skills" className="block text-sm font-medium text-gray-700 mb-2">
                            <Tag className="h-4 w-4 inline mr-1" />
                            Required Skills (Optional)
                          </label>
                          <Input
                            id="required_skills"
                            placeholder="Enter skills separated by commas (e.g., TypeScript, React, Node.js)"
                            {...register('required_skills')}
                            className="transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                        </div>

                        <div className="group">
                          <label htmlFor="candidates_needed" className="block text-sm font-medium text-gray-700 mb-2">
                            <Users className="h-4 w-4 inline mr-1" />
                            Candidates Needed <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="candidates_needed"
                            type="number"
                            min="1"
                            placeholder="e.g., 2"
                            {...register('candidates_needed', {
                              required: 'Number of candidates is required',
                              min: { value: 1, message: 'Must be at least 1' }
                            })}
                            error={!!errors.candidates_needed}
                            className="transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                          />
                          {errors.candidates_needed && (
                            <p className="text-sm text-red-600 mt-1 animate-pulse">{errors.candidates_needed.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Salary */}
                    <div className="form-section space-y-4 p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl shadow-lg border border-teal-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                          Salary Range
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="group">
                          <label htmlFor="min_salary" className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Salary
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              Rp
                            </span>
                            <input
                              id="min_salary"
                              type="text"
                              value={minSalary}
                              onChange={(e) => handleSalaryChange('min_salary', e.target.value)}
                              placeholder="5.000.000"
                              className="flex h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label htmlFor="max_salary" className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Salary
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              Rp
                            </span>
                            <input
                              id="max_salary"
                              type="text"
                              value={maxSalary}
                              onChange={(e) => handleSalaryChange('max_salary', e.target.value)}
                              placeholder="8.000.000"
                              className="flex h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 group-hover:border-teal-400 focus:scale-[1.02]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Profile Requirements */}
                    <div className="form-section space-y-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Required Profile Information
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {profileFields.map((field, index) => (
                          <div
                            key={field.key}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-300 border border-gray-100"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
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

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      variant="outline"
                      className="hover:scale-105 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="job-form"
                      disabled={!isValid || loading}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Publish Job
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #14b8a6, #06b6d4);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #0d9488, #0891b2);
          }
        `}</style>
      </Dialog>
    </Transition>
  )
}
