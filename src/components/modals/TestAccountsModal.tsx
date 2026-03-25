'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ShieldCheck, User, Copy, X, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TestAccountsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TestAccountsModal({ isOpen, onClose }: TestAccountsModalProps) {
  const accounts = [
    {
      role: 'ADMIN ACCOUNT',
      email: 'admin@tes.com',
      password: 'Admin123',
      icon: <ShieldCheck className="h-5 w-5 text-teal-600" />,
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100'
    },
    {
      role: 'CANDIDATE ACCOUNT',
      email: 'kandidat@mail.com',
      password: 'Kandidat123',
      icon: <User className="h-5 w-5 text-indigo-600" />,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    }
  ]

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-0 text-left align-middle shadow-2xl transition-all border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Info className="h-5 w-5" />
                    <Dialog.Title as="h3" className="text-lg font-semibold">
                      Akun Uji Coba (Testing)
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Gunakan akun di bawah ini untuk mencoba fitur aplikasi sebagai Admin atau Kandidat.
                  </p>

                  {accounts.map((account) => (
                    <div
                      key={account.role}
                      className={`${account.bgColor} ${account.borderColor} border rounded-2xl p-4 transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {account.icon}
                        <span className="text-xs font-bold tracking-wider text-gray-700">
                          {account.role}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white/60 rounded-lg p-2 border border-white">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-gray-400 font-bold">Email</span>
                            <span className="text-sm font-medium text-gray-800">{account.email}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(account.email, 'Email')}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-teal-600"
                            title="Salin Email"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-white/60 rounded-lg p-2 border border-white">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-gray-400 font-bold">Password</span>
                            <span className="text-sm font-medium text-gray-800">{account.password}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(account.password, 'Password')}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-teal-600"
                            title="Salin Password"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={onClose}
                    className="w-full mt-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl transition-all border border-gray-100"
                  >
                    Tutup dan Lanjutkan Ke Login
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
