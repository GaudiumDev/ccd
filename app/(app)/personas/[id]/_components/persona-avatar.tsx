'use client'

import { AvatarUpload } from '@/components/avatar-upload'
import Image from 'next/image'

interface PersonaAvatarProps {
  personaId: string
  fotoUrl: string | null
  initials: string
  canUpdate: boolean
}

export function PersonaAvatar({ personaId, fotoUrl, initials, canUpdate }: PersonaAvatarProps) {
  if (canUpdate) {
    return (
      <AvatarUpload
        personaId={personaId}
        currentUrl={fotoUrl}
        initials={initials}
        size="lg"
      />
    )
  }

  // Read-only display
  if (fotoUrl) {
    return (
      <div className="h-16 w-16 rounded-full overflow-hidden shrink-0">
        <Image src={fotoUrl} alt="Foto de perfil" width={64} height={64} className="object-cover w-full h-full" />
      </div>
    )
  }

  return (
    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
      {initials}
    </div>
  )
}
