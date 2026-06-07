'use client'
import { CldUploadWidget } from 'next-cloudinary'

interface Props {
  photoUrl: string
  onUpload: (url: string) => void
  btnStyle: React.CSSProperties
}

export function PhotoUpload({ photoUrl, onUpload, btnStyle }: Props) {
  return (
    <CldUploadWidget
      uploadPreset="recipe_vault"
      onSuccess={result => {
        if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
          onUpload(result.info.secure_url as string)
        }
      }}
    >
      {({ open }) => (
        <div>
          <button type="button" onClick={() => open()} style={btnStyle}>
            {photoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Preview"
              style={{ display: 'block', marginTop: 8, borderRadius: 12, maxWidth: 300, width: '100%' }}
            />
          )}
        </div>
      )}
    </CldUploadWidget>
  )
}
