'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  personaId: string
  currentUrl: string | null
  initials: string
  size?: 'sm' | 'lg'
  onUploaded?: (url: string) => void
}

export function AvatarUpload({ personaId, currentUrl, initials, size = 'sm', onUploaded }: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const dim = size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'
  const iconDim = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'
  const textSize = size === 'lg' ? 'text-xl' : 'text-sm'
  const imgSize = size === 'lg' ? 64 : 40

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${personaId}/foto.${ext}`

    const { error: upErr } = await supabase.storage
      .from('fotos-perfil')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setError('Error al subir la foto.')
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('fotos-perfil').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now()

    const { error: dbErr } = await supabase
      .from('personas')
      .update({ foto_url: urlData.publicUrl })
      .eq('id', personaId)

    setLoading(false)

    if (dbErr) {
      setError('Foto subida pero no se pudo guardar el enlace.')
      return
    }

    setUrl(publicUrl)
    onUploaded?.(urlData.publicUrl)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={`relative ${dim} rounded-full overflow-hidden bg-primary/10 text-primary font-bold ${textSize} shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        title="Cambiar foto"
      >
        {url ? (
          <Image src={url} alt="Foto de perfil" width={imgSize} height={imgSize} className="object-cover w-full h-full" />
        ) : (
          <span className="flex items-center justify-center w-full h-full">
            {initials || <User className={iconDim} />}
          </span>
        )}
        <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          {loading
            ? <Loader2 className="h-4 w-4 text-white animate-spin" />
            : <Camera className="h-4 w-4 text-white" />
          }
        </span>
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
