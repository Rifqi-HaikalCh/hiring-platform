'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { ArrowLeft, Camera, Download, Upload, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { WebcamGestureModal } from '@/components/modals/WebcamGestureModal'
import { getJobById, type Job } from '@/lib/supabase/jobs'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

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

interface ApplicationFormData {
  full_name?: string
  photo_profile?: File | string | null
  gender?: string
  domicile?: string
  email?: string
  phone_number?: string
  linkedin_link?: string
  date_of_birth?: Date | null
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

const indonesianProvinces = [
  { value: 'aceh', label: 'Aceh' },
  { value: 'bali', label: 'Bali' },
  { value: 'banten', label: 'Banten' },
  { value: 'bengkulu', label: 'Bengkulu' },
  { value: 'diy', label: 'DI Yogyakarta' },
  { value: 'dki_jakarta', label: 'DKI Jakarta' },
  { value: 'gorontalo', label: 'Gorontalo' },
  { value: 'jambi', label: 'Jambi' },
  { value: 'jawa_barat', label: 'Jawa Barat' },
  { value: 'jawa_tengah', label: 'Jawa Tengah' },
  { value: 'jawa_timur', label: 'Jawa Timur' },
  { value: 'kalimantan_barat', label: 'Kalimantan Barat' },
  { value: 'kalimantan_selatan', label: 'Kalimantan Selatan' },
  { value: 'kalimantan_tengah', label: 'Kalimantan Tengah' },
  { value: 'kalimantan_timur', label: 'Kalimantan Timur' },
  { value: 'kalimantan_utara', label: 'Kalimantan Utara' },
  { value: 'kepulauan_bangka_belitung', label: 'Kepulauan Bangka Belitung' },
  { value: 'kepulauan_riau', label: 'Kepulauan Riau' },
  { value: 'lampung', label: 'Lampung' },
  { value: 'maluku', label: 'Maluku' },
  { value: 'maluku_utara', label: 'Maluku Utara' },
  { value: 'nusa_tenggara_barat', label: 'Nusa Tenggara Barat' },
  { value: 'nusa_tenggara_timur', label: 'Nusa Tenggara Timur' },
  { value: 'papua', label: 'Papua' },
  { value: 'papua_barat', label: 'Papua Barat' },
  { value: 'papua_barat_daya', label: 'Papua Barat Daya' },
  { value: 'papua_pegunungan', label: 'Papua Pegunungan' },
  { value: 'papua_selatan', label: 'Papua Selatan' },
  { value: 'papua_tengah', label: 'Papua Tengah' },
  { value: 'riau', label: 'Riau' },
  { value: 'sulawesi_barat', label: 'Sulawesi Barat' },
  { value: 'sulawesi_selatan', label: 'Sulawesi Selatan' },
  { value: 'sulawesi_tengah', label: 'Sulawesi Tengah' },
  { value: 'sulawesi_tenggara', label: 'Sulawesi Tenggara' },
  { value: 'sulawesi_utara', label: 'Sulawesi Utara' },
  { value: 'sumatera_barat', label: 'Sumatera Barat' },
  { value: 'sumatera_selatan', label: 'Sumatera Selatan' },
  { value: 'sumatera_utara', label: 'Sumatera Utara' }
]

const countryCodeOptions = [
  { value: '+62', label: '+62 (Indonesia)', flag: '🇮🇩' },
  { value: '+1', label: '+1 (US/Canada)', flag: '🇺🇸' },
  { value: '+44', label: '+44 (UK)', flag: '🇬🇧' },
  { value: '+65', label: '+65 (Singapore)', flag: '🇸🇬' },
  { value: '+60', label: '+60 (Malaysia)', flag: '🇲🇾' },
  { value: '+66', label: '+66 (Thailand)', flag: '🇹🇭' },
  { value: '+84', label: '+84 (Vietnam)', flag: '🇻🇳' },
  { value: '+63', label: '+63 (Philippines)', flag: '🇵🇭' },
  { value: '+91', label: '+91 (India)', flag: '🇮🇳' },
  { value: '+86', label: '+86 (China)', flag: '🇨🇳' },
  { value: '+81', label: '+81 (Japan)', flag: '🇯🇵' },
  { value: '+82', label: '+82 (South Korea)', flag: '🇰🇷' },
  { value: '+61', label: '+61 (Australia)', flag: '🇦🇺' }
]

const formatOptionLabel = ({ label, flag }: any) => (
  <div className="flex items-center">
    <span className="mr-2">{flag}</span>
    <span>{label}</span>
  </div>
)

export default function ApplyJobPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showGestureModal, setShowGestureModal] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodeOptions[0])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const jobId = params.jobId as string

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ApplicationFormData>({
    mode: 'onChange'
  })

  useEffect(() => {
    if (!user) {
      toast.error('Please login to apply for jobs')
      router.push('/auth')
      return
    }
    loadJob()
  }, [jobId, user, router])

  const loadJob = async () => {
    try {
      setLoading(true)
      const { data, error } = await getJobById(jobId)

      if (error || !data) {
        toast.error('Job not found')
        router.push('/dashboard')
        return
      }

      setJob(data)
    } catch (error) {
      console.error('Load job error:', error)
      toast.error('Failed to load job details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formConfig: FormConfiguration = job?.form_configuration || {}

  const getFieldRequirement = (field: keyof FormConfiguration): RequirementState => {
    return formConfig[field] || 'off'
  }

  const isFieldRequired = (field: keyof FormConfiguration): boolean => {
    return getFieldRequirement(field) === 'mandatory'
  }

  const isFieldVisible = (field: keyof FormConfiguration): boolean => {
    const requirement = getFieldRequirement(field)
    return requirement === 'mandatory' || requirement === 'optional'
  }

  const handleGestureCapture = useCallback((imageBase64: string) => {
    setCapturedImage(imageBase64)
    setValue('photo_profile', imageBase64)
  }, [setValue])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        setValue('photo_profile', file)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setCapturedImage(null)
    setPhotoFile(null)
    setValue('photo_profile', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper function to convert base64 to File
  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const res = await fetch(base64)
    const blob = await res.blob()
    return new File([blob], filename, { type: 'image/jpeg' })
  }

  // Helper function to upload photo to Supabase Storage
  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `public/${user!.id}-${jobId}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('application_photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        return null
      }

      const { data: urlData } = supabase.storage
        .from('application_photos')
        .getPublicUrl(uploadData.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Unexpected error uploading photo:', error)
      return null
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user || !job) return

    try {
      setSubmitting(true)

      // Check if user already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single()

      if (existingApplication) {
        toast.error('You have already applied to this job')
        return
      }

      // Handle photo upload if photo exists
      let photoUrl: string | null = null
      if (data.photo_profile) {
        let photoFile: File

        if (typeof data.photo_profile === 'string') {
          // Base64 from gesture capture
          photoFile = await base64ToFile(data.photo_profile, 'profile_pic.jpg')
        } else {
          // File from upload
          photoFile = data.photo_profile
        }

        photoUrl = await uploadPhoto(photoFile)
        if (!photoUrl && isFieldRequired('photo_profile')) {
          toast.error('Failed to upload photo. Please try again.')
          return
        }
      }

      // Prepare application data
      const applicationPayload = {
        ...data,
        date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString() : null,
        phone_number: data.phone_number ? `${selectedCountryCode.value}${data.phone_number}` : null,
        photo_profile_url: photoUrl
      }

      // Remove the raw photo data from payload
      delete applicationPayload.photo_profile

      const applicationData = {
        job_id: jobId,
        applicant_id: user.id,
        status: 'submitted',
        application_data: applicationPayload
      }

      // Submit application
      const { data: applicationResult, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single()

      if (error) {
        console.error('Application submission error:', error)
        toast.error('Failed to submit application')
        return
      }

      toast.success('Application submitted successfully!')
      router.push('/dashboard')

    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Apply for {job.job_title}</h1>
              <p className="text-sm text-gray-600">Fill out the form below to submit your application</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              {isFieldVisible('full_name') && (
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name {isFieldRequired('full_name') && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    {...register('full_name', {
                      required: isFieldRequired('full_name') ? 'Full name is required' : false
                    })}
                    error={!!errors.full_name}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                  )}
                </div>
              )}

              {/* Photo Profile */}
              {isFieldVisible('photo_profile') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Profile {isFieldRequired('photo_profile') && <span className="text-red-500">*</span>}
                  </label>
                  <div className="space-y-4">
                    {capturedImage ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={capturedImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={() => setShowGestureModal(true)}
                            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take a Picture
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          📸 Try our AI-powered gesture capture for a fun photo experience!
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <WebcamGestureModal
                      isOpen={showGestureModal}
                      onClose={() => setShowGestureModal(false)}
                      onCapture={handleGestureCapture}
                    />
                  </div>
                  {isFieldRequired('photo_profile') && !capturedImage && (
                    <p className="text-sm text-red-600 mt-1">Photo profile is required</p>
                  )}
                </div>
              )}

              {/* Gender */}
              {isFieldVisible('gender') && (
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender {isFieldRequired('gender') && <span className="text-red-500">*</span>}
                  </label>
                  <Controller
                    name="gender"
                    control={control}
                    rules={{
                      required: isFieldRequired('gender') ? 'Gender is required' : false
                    }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={genderOptions}
                        placeholder="Select gender"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        onChange={(option) => field.onChange(option?.value)}
                        value={genderOptions.find(option => option.value === field.value)}
                      />
                    )}
                  />
                  {errors.gender && (
                    <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              )}

              {/* Domicile */}
              {isFieldVisible('domicile') && (
                <div>
                  <label htmlFor="domicile" className="block text-sm font-medium text-gray-700 mb-1">
                    Domicile {isFieldRequired('domicile') && <span className="text-red-500">*</span>}
                  </label>
                  <Controller
                    name="domicile"
                    control={control}
                    rules={{
                      required: isFieldRequired('domicile') ? 'Domicile is required' : false
                    }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={indonesianProvinces}
                        placeholder="Select province"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isSearchable
                        onChange={(option) => field.onChange(option?.value)}
                        value={indonesianProvinces.find(option => option.value === field.value)}
                      />
                    )}
                  />
                  {errors.domicile && (
                    <p className="text-sm text-red-600 mt-1">{errors.domicile.message}</p>
                  )}
                </div>
              )}

              {/* Email */}
              {isFieldVisible('email') && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email {isFieldRequired('email') && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email', {
                      required: isFieldRequired('email') ? 'Email is required' : false,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
              )}

              {/* Phone Number */}
              {isFieldVisible('phone_number') && (
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number {isFieldRequired('phone_number') && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex space-x-2">
                    <div className="w-40">
                      <Select
                        options={countryCodeOptions}
                        value={selectedCountryCode}
                        onChange={(option) => option && setSelectedCountryCode(option)}
                        formatOptionLabel={formatOptionLabel}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isSearchable={false}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="812345678"
                        {...register('phone_number', {
                          required: isFieldRequired('phone_number') ? 'Phone number is required' : false,
                          pattern: {
                            value: /^[0-9]{8,15}$/,
                            message: 'Phone number must be 8-15 digits'
                          }
                        })}
                        error={!!errors.phone_number}
                      />
                    </div>
                  </div>
                  {errors.phone_number && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone_number.message}</p>
                  )}
                </div>
              )}

              {/* LinkedIn Link */}
              {isFieldVisible('linkedin_link') && (
                <div>
                  <label htmlFor="linkedin_link" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile {isFieldRequired('linkedin_link') && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    id="linkedin_link"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    {...register('linkedin_link', {
                      required: isFieldRequired('linkedin_link') ? 'LinkedIn profile is required' : false,
                      pattern: {
                        value: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
                        message: 'Please enter a valid LinkedIn profile URL'
                      }
                    })}
                    error={!!errors.linkedin_link}
                  />
                  {errors.linkedin_link && (
                    <p className="text-sm text-red-600 mt-1">{errors.linkedin_link.message}</p>
                  )}
                </div>
              )}

              {/* Date of Birth */}
              {isFieldVisible('date_of_birth') && (
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth {isFieldRequired('date_of_birth') && <span className="text-red-500">*</span>}
                  </label>
                  <Controller
                    name="date_of_birth"
                    control={control}
                    rules={{
                      required: isFieldRequired('date_of_birth') ? 'Date of birth is required' : false
                    }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        selected={field.value}
                        onChange={(date) => field.onChange(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date of birth"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                        yearDropdownItemNumber={50}
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-600 mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}