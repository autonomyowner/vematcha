import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Matcha - AI-Powered Psychological Insights';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8f6f0 0%, #e8e4d9 100%)',
          position: 'relative',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(104, 166, 125, 0.2) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180, 130, 100, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
            zIndex: 10,
          }}
        >
          {/* Logo text */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#5a9470',
              marginBottom: '20px',
              fontFamily: 'Georgia, serif',
            }}
          >
            Matcha
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 36,
              color: '#2d3436',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.3,
              marginBottom: '30px',
            }}
          >
            AI-Powered Psychological Insights
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: '#636e72',
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.5,
            }}
          >
            Understand your cognitive biases, emotional patterns, and unlock personal growth
          </div>

          {/* Features pills */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '40px',
            }}
          >
            {['Voice Therapy', 'EMDR Sessions', 'Real-time Analysis'].map((feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(104, 166, 125, 0.15)',
                  color: '#5a9470',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: 20,
            color: '#b2bec3',
          }}
        >
          vematcha.xyz
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
