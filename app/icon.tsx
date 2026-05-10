import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          {/* Bottom stone */}
          <ellipse cx="32" cy="50" rx="26" ry="12" fill="#1a6b3f" />
          {/* Mid stone */}
          <ellipse cx="32" cy="29" rx="17" ry="9" fill="#2d8a52" />
          {/* Top stone */}
          <ellipse cx="32" cy="12" rx="10" ry="6" fill="#6db88a" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
