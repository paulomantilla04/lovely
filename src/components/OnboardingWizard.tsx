import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  Instagram,
  Upload,
  X,
  Heart,
  Users,
  Coffee,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "../config/supabaseClient"
import { UserAuth } from "../context/AuthContext"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"


// --- UTILITIES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TYPES ---
type PhotoItem = {
  id: string
  url: string
  file: File
}

type HobbyItem = {
  id: string
  name: string
}

type FormData = {
  firstName: string
  email: string
  password: string
  dob: string
  otp: string
  instagram: string
  description: string
  gender: string
  interestedIn: string[]
  intent: string
  hobbies: string[]
  photos: PhotoItem[]
}

const INITIAL_DATA: FormData = {
  firstName: "",
  email: "",
  password: "",
  dob: "",
  otp: "",
  instagram: "",
  description: "",
  gender: "",
  interestedIn: [],
  intent: "",
  hobbies: [],
  photos: [],
}

export function OnboardingWizard() {
  const { signUp, user } = UserAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isNextDisabled, setIsNextDisabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(0)
  const [dbHobbies, setDbHobbies] = useState<HobbyItem[]>([])

  useEffect(() => {
    const fetchHobbies = async () => {
      // Opcional: Solo intentar si hay usuario, para evitar errores 401 innecesarios
      if (!user) return 

      const { data, error } = await supabase.from('hobbies').select('*')
      
      if (error) {
        console.error("Error cargando hobbies:", error)
      }
      
      if (data) {
        setDbHobbies(data)
      }
    }

    fetchHobbies()
  }, [user])

  useEffect(() => {
    validateStep()
  }, [step, formData])

  const validateStep = () => {
    let isValid = false
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    switch (step) {
      case 1:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const isEmailValid = emailRegex.test(formData.email)
        const isPasswordValid = formData.password.length >= 6

        let isAgeValid = false
        if (formData.dob) {
          const birthDate = new Date(formData.dob)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
          isAgeValid = age >= 16
          if (!isAgeValid) newErrors.dob = "Debes tener al menos 16 años."
        }

        if (!isEmailValid && formData.email) newErrors.email = "Ingresa un correo electrónico válido"
        if (!isPasswordValid && formData.password) newErrors.password = "Mínimo 6 caracteres"

        isValid = !!formData.firstName && isEmailValid && isAgeValid && isPasswordValid
        break
      case 2:
        isValid = formData.otp.length === 8
        break
      case 3:
        isValid = !!formData.instagram && !!formData.description
        break
      case 4:
        isValid = !!formData.gender
        break
      case 5:
        isValid = formData.interestedIn.length > 0
        break
      case 6:
        isValid = !!formData.intent
        break
      case 7:
        isValid = formData.hobbies.length >= 3
        break
      case 8:
        isValid = formData.photos.length >= 3
        break
      case 9:
        isValid = true
        break
    }

    setErrors(newErrors)
    setIsNextDisabled(!isValid)
  }

  const handleNext = async () => {
    if (isNextDisabled || loading) return
    setLoading(true)

    try {
      if (step === 1) {
        const { success, error } = await signUp(formData.email, formData.password, formData.firstName)
        if (!success) {
          setErrors({ ...errors, email: error?.message || "Error al registrarse" })
          setLoading(false)
          return
        }
      }

      if (step === 2) {
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: formData.otp,
          type: 'signup'
        })
        if (error) {
          setErrors({ ...errors, otp: "Código incorrecto o expirado" })
          setLoading(false)
          return
        }
      }

      if (step === 8) {
        await saveDataToSupabase()
        setLoading(false)
        setStep(9)
        return
      }

      setLoading(false)
      setDirection(1)
      setStep((prev) => Math.min(prev + 1, 9))
    } catch (err) {
      console.error(err)
      setLoading(false)
      alert("Ocurrió un error inesperado.")
    }
  }

  const saveDataToSupabase = async () => {
    const currentUser = user || (await supabase.auth.getUser()).data.user
    if (!currentUser) throw new Error("No hay usuario autenticado")

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

    // 1. Insertar Perfil
    const { error: profileError } = await supabase.from('profiles').insert({
      id: currentUser.id,
      name: formData.firstName,
      email: formData.email,
      date_of_birth: formData.dob,
      gender: formData.gender.toLowerCase(),
      preferences: formData.interestedIn.map(p => p.toLowerCase()),
      instagram: formData.instagram,
      looking_for: formData.intent,
      description: formData.description // NUEVO: Guardar descripción
    })
    if (profileError) throw profileError

    // 2. Insertar Hobbies
    if (formData.hobbies.length > 0) {
      const hobbiesInserts = formData.hobbies.map(hobbyId => ({
        profile_id: currentUser.id,
        hobby_id: hobbyId
      }))
      const { error: hobbiesError } = await supabase.from('user_hobbies').insert(hobbiesInserts)
      if (hobbiesError) throw hobbiesError
    }

    // 3. Subir Fotos
    for (const photo of formData.photos) {
      const fileExt = photo.file.name.split('.').pop()
      const fileName = `${currentUser.id}/${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('user_photos')
        .upload(fileName, photo.file)

      if (uploadError) {
        console.error("Error subiendo foto", uploadError)
        continue
      }

      const photoUrl = `${supabaseUrl}/storage/v1/object/public/user_photos/${fileName}`

      await supabase.from('photos').insert({
        profile_id: currentUser.id,
        photo_url: photoUrl
      })
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSelection = (field: "interestedIn" | "hobbies", value: string) => {
    setFormData((prev) => {
      const current = prev[field]
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const newPhoto: PhotoItem = { id: Math.random().toString(36), url, file }
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, newPhoto].slice(0, 6),
      }))
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 50 : -50, opacity: 0 }),
  }

  if (step === 9) return <SuccessScreen />

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md rounded-xl mx-auto shadow-2xl overflow-hidden relative font-sans">
      <div className="px-6 pt-8 pb-4 bg-background z-10">
        <div className="flex items-center justify-between mb-6">
          {step > 1 && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-muted-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2 mx-auto">
            <span className="font-bold text-lg tracking-tight text-primary font-montserrat">Lovely</span>
          </div>
          <div className="w-10" />
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 9) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            className="h-full flex flex-col"
          >
            {step === 1 && <StepBasicInfo data={formData} update={updateField} errors={errors} />}
            {step === 2 && <StepVerification data={formData} update={updateField} error={errors.otp} />}
            {step === 3 && <StepSocial data={formData} update={updateField} />}
            {step === 4 && <StepGender data={formData} update={updateField} />}
            {step === 5 && <StepInterestedIn data={formData} toggle={toggleSelection} />}
            {step === 6 && <StepIntent data={formData} update={updateField} />}
            {step === 7 && <StepHobbies data={formData} toggle={toggleSelection} dbHobbies={dbHobbies} />}
            {step === 8 && <StepPhotos data={formData} onUpload={handlePhotoUpload} onRemove={removePhoto} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 bg-background border-t border-border z-10">
        <button
          onClick={handleNext}
          disabled={isNextDisabled || loading}
          className={cn(
            "w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm font-montserrat",
            isNextDisabled || loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-[#8527C3] to-[#D28EFF] text-white hover:scale-[1.02] cursor-pointer active:scale-[0.98]",
          )}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {step === 2 ? "Verificar Código" : step === 8 ? "Finalizar Registro" : "Continuar"}
              {step !== 8 && step !== 2 && <ChevronRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// --- STEP COMPONENTS ---

function StepBasicInfo({ data, update, errors }: { data: FormData; update: any; errors: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">Cuéntanos sobre ti</h2>
        <p className="text-muted-foreground font-inter text-sm">Necesitamos algunos datos básicos para empezar.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Nombre</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Tu primer nombre"
            className="w-full p-2 rounded-lg text-xs bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Correo Institucional</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="usuario@uaeh.edu.mx"
            className={cn(
              "w-full p-2 rounded-lg text-xs bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none",
              errors.email && "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
            )}
          />
          {errors.email && (
            <p className="text-xs text-destructive ml-1 flex items-center gap-1">
              <AlertCircle className="w-2 h-2" /> {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Contraseña</label>
          <input
            type="password"
            value={data.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="Crea una contraseña segura"
            className={cn(
              "w-full p-2 rounded-lg text-xs bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none",
              errors.password && "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
            )}
          />
          {errors.password && (
            <p className="text-xs text-destructive ml-1 flex items-center gap-1">
              <AlertCircle className="w-2 h-2" /> {errors.password}
            </p>
          )}
        </div>
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Fecha de Nacimiento</label>
          <input
            type="date"
            value={data.dob}
            onChange={(e) => update("dob", e.target.value)}
            className={cn(
              "w-full p-2 rounded-lg text-xs bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none",
              errors.dob && "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
            )}
          />
          {errors.dob && (
            <p className="text-xs text-destructive ml-1 flex items-center gap-1">
              <AlertCircle className="w-2 h-2" /> {errors.dob}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function StepVerification({ data, update, error }: { data: FormData; update: any; error?: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">Verifica tu correo</h2>
        <p className="text-muted-foreground font-inter text-sm">
          Hemos enviado un código de 8 dígitos a <span className="font-medium text-foreground">{data.email}</span>
        </p>
      </div>
      <div className="pt-4 flex flex-col items-center">

        <InputOTP
          maxLength={8}
          value={data.otp}
          onChange={(value) => update("otp", value)}
          pattern={REGEXP_ONLY_DIGITS}
          className="font-inter text-xs"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0}/>
            <InputOTPSlot index={1}/>
            <InputOTPSlot index={2}/>
            <InputOTPSlot index={3}/>
          </InputOTPGroup>

          <InputOTPSeparator/>

          <InputOTPGroup>
            <InputOTPSlot index={4}/>
            <InputOTPSlot index={5}/>
            <InputOTPSlot index={6}/>
            <InputOTPSlot index={7}/>
          </InputOTPGroup>
        
        
        </InputOTP>
        

        {error && (
          <p className="text-center text-sm text-destructive mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
    </div>
  )
}

function StepSocial({ data, update }: { data: FormData; update: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">Tu perfil social</h2>
        <p className="text-muted-foreground font-inter text-sm">Cuéntanos un poco sobre ti y conecta tus redes.</p>
      </div>
      
      <div className="space-y-4 pt-2">
        {/* Input de Instagram existente */}
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Instagram (para verificar identidad)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Instagram className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground ml-2 font-medium">@</span>
            </div>
            <input
              type="text"
              value={data.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder="usuario"
              className="w-full pl-16 p-2 rounded-lg bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* NUEVO: Input de Descripción */}
        <div className="space-y-2 font-montserrat">
          <label className="text-xs font-medium ml-1">Sobre ti (Descripción)</label>
          <textarea
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Me gusta el café, los gatos y programar en React..."
            maxLength={150}
            rows={4}
            className="w-full p-3 rounded-lg bg-muted/50 border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-sm font-inter"
          />
          <div className="text-right text-xs text-muted-foreground">
            {data.description.length}/150
          </div>
        </div>
      </div>
    </div>
  )
}

function StepGender({ data, update }: { data: FormData; update: any }) {
  const options = ["Hombre", "Mujer", "No binario", "Otro"]
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">¿Cómo te identificas?</h2>
      </div>
      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => update("gender", option)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 flex items-center justify-between font-inter text-sm cursor-pointer",
              data.gender === option
                ? "border-primary bg-primary/5 text-primary"
                : "border-transparent bg-muted/50 hover:bg-muted text-foreground",
            )}
          >
            {option}
            {data.gender === option && <CheckCircle2 className="w-5 h-5" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepInterestedIn({ data, toggle }: { data: FormData; toggle: any }) {
  const options = ["Hombres", "Mujeres", "Personas no binarias", "Todos"]
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">¿A quién quieres conocer?</h2>
      </div>
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = data.interestedIn.includes(option)
          return (
            <button
              key={option}
              onClick={() => toggle("interestedIn", option)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 flex items-center justify-between font-inter text-sm cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent bg-muted/50 hover:bg-muted text-foreground",
              )}
            >
              {option}
              {isSelected && <CheckCircle2 className="w-5 h-5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepIntent({ data, update }: { data: FormData; update: any }) {
  const options = [
    { id: "relación", icon: Heart, label: "Una relación seria" },
    { id: "amistad", icon: Users, label: "Hacer amigos" },
    { id: "aún no lo sé", icon: Coffee, label: "Aún no lo sé" },
  ]
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">¿Qué estás buscando?</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = data.intent === option.id
          return (
            <button
              key={option.id}
              onClick={() => update("intent", option.id)}
              className={cn(
                "p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 text-left font-inter cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-6 h-6", isSelected && "fill-current")} />
              <span className="font-medium text-sm">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepHobbies({ data, toggle, dbHobbies }: { data: FormData; toggle: any; dbHobbies: HobbyItem[] }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">Tus intereses</h2>
        <p className="text-muted-foreground font-inter text-sm">Selecciona al menos 3 cosas que te gusten.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {dbHobbies.length === 0 ? (
          <p className="text-muted-foreground italic font-inter text-sm">Cargando hobbies...</p>
        ) : (
          dbHobbies.map((hobby) => {
            const isSelected = data.hobbies.includes(hobby.id)
            return (
              <button
                key={hobby.id}
                onClick={() => toggle("hobbies", hobby.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer font-inter text-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50 text-foreground",
                )}
              >
                {hobby.name}
              </button>
            )
          })
        )}
      </div>
      <div className="text-sm text-muted-foreground text-center font-inter text-xs">{data.hobbies.length} seleccionados</div>
    </div>
  )
}

function StepPhotos({ data, onUpload, onRemove }: { data: FormData; onUpload: any; onRemove: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground font-montserrat">Añade tus fotos</h2>
        <p className="text-muted-foreground font-inter text-sm">Sube al menos 3 fotos.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, index) => {
          const photo = data.photos[index]
          return (
            <div
              key={index}
              className={cn(
                "aspect-[3/4] rounded-xl relative overflow-hidden border-2 border-dashed transition-all",
                photo ? "border-transparent" : "border-muted-foreground/20 bg-muted/30",
              )}
            >
              {photo ? (
                <>
                  <img src={photo.url} alt="User upload" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemove(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center rounded-xl justify-center p-6 text-center max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
      >
        <Sparkles className="w-12 h-12 text-primary" />
      </motion.div>
      <h1 className="text-3xl font-bold text-foreground mb-2 font-montserrat">¡Perfil Creado!</h1>
      <p className="text-muted-foreground mb-8 font-montserrat">Bienvenido a Lovely</p>
    </div>
  )
}