'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Briefcase, Users, DollarSign, TrendingUp, Brain, Loader2, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    initialPassword: 'client123',
    createCredentials: true,
    phone: '',
    dateOfBirth: '',
    occupation: '',
    city: '',
    maritalStatus: 'Single',
    dependents: 0,
    familyNotes: '',
    incomeRange: '',
    netWorthBand: '',
    primaryLiability: '',
    statedRiskScore: 5,
    discomfortBudget: 10,
    panicThreshold: -5,
    decisionTemperament: 'BALANCED',
    behavioralSummary: ''
  })

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Please enter client name')
        return false
      }
      if (!formData.email.trim()) {
        setError('Please enter client email')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address')
        return false
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const advisorId = authUser?.id ?? null
      const response = await fetch('/api/advisor/clients/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, advisorId, initialPassword: formData.createCredentials ? formData.initialPassword : undefined })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to onboard client')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/advisor/clients/${data.clientId}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 border-2 border-success mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-display font-bold text-fg-primary mb-3">Client Onboarded Successfully</h1>
          <p className="text-fg-secondary mb-6">Redirecting to client profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link
            href="/advisor/clients"
            className="inline-flex items-center gap-2 text-fg-secondary hover:text-fg-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <h1 className="font-display font-bold text-4xl text-fg-primary mb-2">Onboard New Client</h1>
          <p className="text-fg-secondary">Complete this form with your client during your first meeting</p>
        </div>

        <div className="mb-8 flex items-center gap-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                currentStep >= step ? 'bg-accent border-accent text-white' : 'border-border text-fg-muted'
              }`}>
                {step}
              </div>
              <div className={`text-sm font-medium ${
                currentStep >= step ? 'text-fg-primary' : 'text-fg-muted'
              }`}>
                {step === 1 && 'Personal Info'}
                {step === 2 && 'Financial Profile'}
                {step === 3 && 'Behavioral Profile'}
              </div>
              {step < 3 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 1 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-fg-primary">Personal Information</h2>
                  <p className="text-sm text-fg-muted">Basic details about your client</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Enter client's full name"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="client@example.com"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-3 p-4 bg-bg-primary border border-border rounded-lg cursor-pointer hover:bg-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.createCredentials}
                      onChange={(e) => updateField('createCredentials', e.target.checked)}
                      className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent/20"
                    />
                    <div>
                      <div className="font-medium text-fg-primary">Create client portal credentials</div>
                      <div className="text-sm text-fg-muted">Allow client to access their portal with this email</div>
                    </div>
                  </label>
                </div>

                {formData.createCredentials && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-fg-primary mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Initial Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.initialPassword}
                        onChange={(e) => updateField('initialPassword', e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-bg-primary border border-border rounded-lg text-fg-primary
                                   focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono"
                        placeholder="Set a secure password"
                        minLength={8}
                        required={formData.createCredentials}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-fg-muted mt-1.5">
                      The client will use this to log in. Share it securely — they can change it later.
                      Minimum 8 characters.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="+91-98765-43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Marital Status
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => updateField('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Number of Dependents
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dependents}
                    onChange={(e) => updateField('dependents', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Family Notes
                  </label>
                  <textarea
                    value={formData.familyNotes}
                    onChange={(e) => updateField('familyNotes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Any relevant family information..."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-fg-primary">Financial Profile</h2>
                  <p className="text-sm text-fg-muted">Income, wealth, and risk assessment</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Annual Income Range
                  </label>
                  <select
                    value={formData.incomeRange}
                    onChange={(e) => updateField('incomeRange', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select range</option>
                    <option>₹5-10L</option>
                    <option>₹10-15L</option>
                    <option>₹15-25L</option>
                    <option>₹25-50L</option>
                    <option>₹50L-1Cr</option>
                    <option>₹1-2Cr</option>
                    <option>₹2Cr+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Net Worth Band
                  </label>
                  <select
                    value={formData.netWorthBand}
                    onChange={(e) => updateField('netWorthBand', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select band</option>
                    <option>₹10-50L</option>
                    <option>₹50L-1Cr</option>
                    <option>₹1-2Cr</option>
                    <option>₹2-5Cr</option>
                    <option>₹5-10Cr</option>
                    <option>₹10Cr+</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Primary Liability
                  </label>
                  <input
                    type="text"
                    value={formData.primaryLiability}
                    onChange={(e) => updateField('primaryLiability', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="e.g., Home loan, Car loan, None"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Stated Risk Score: {formData.statedRiskScore}
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fg-muted">Low Risk</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.statedRiskScore}
                      onChange={(e) => updateField('statedRiskScore', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-fg-muted">High Risk</span>
                    <span className="text-lg font-semibold text-accent w-8 text-center">{formData.statedRiskScore}</span>
                  </div>
                  <p className="text-xs text-fg-muted mt-2">How much risk does the client say they can tolerate?</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Discomfort Budget: {formData.discomfortBudget}%
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fg-muted">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={formData.discomfortBudget}
                      onChange={(e) => updateField('discomfortBudget', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-fg-muted">30%</span>
                    <span className="text-lg font-semibold text-accent w-12 text-center">{formData.discomfortBudget}%</span>
                  </div>
                  <p className="text-xs text-fg-muted mt-2">Maximum portfolio decline before discomfort</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Panic Threshold: {formData.panicThreshold}%
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fg-muted">-20%</span>
                    <input
                      type="range"
                      min="-20"
                      max="0"
                      value={formData.panicThreshold}
                      onChange={(e) => updateField('panicThreshold', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-fg-muted">0%</span>
                    <span className="text-lg font-semibold text-danger w-12 text-center">{formData.panicThreshold}%</span>
                  </div>
                  <p className="text-xs text-fg-muted mt-2">Portfolio decline likely to trigger panic selling</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-fg-primary">Behavioral Profile</h2>
                  <p className="text-sm text-fg-muted">Decision-making patterns and tendencies</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Decision Temperament
                  </label>
                  <select
                    value={formData.decisionTemperament}
                    onChange={(e) => updateField('decisionTemperament', e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="DELIBERATE">Deliberate - Thinks through decisions carefully</option>
                    <option value="REACTIVE">Reactive - Quick to respond to market changes</option>
                    <option value="AVOIDANT">Avoidant - Prefers to delay decisions</option>
                    <option value="OVERCONFIDENT">Overconfident - Very confident in decisions</option>
                    <option value="ANCHORED">Anchored - Sticks to initial beliefs</option>
                    <option value="BALANCED">Balanced - Mix of traits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-primary mb-2">
                    Behavioral Summary
                  </label>
                  <textarea
                    value={formData.behavioralSummary}
                    onChange={(e) => updateField('behavioralSummary', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Notes on client's behavioral tendencies, past investment experiences, concerns, and decision-making patterns..."
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 border border-border text-fg-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Previous
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="ml-auto px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-warm transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-8 py-3 bg-accent text-white rounded-lg hover:bg-accent-warm transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
