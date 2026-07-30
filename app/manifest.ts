import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VCARDS SPACE Digital Card',
    short_name: 'VCARDS SPACE',
    description: 'Digital Business Card & Contact Info',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#25394d',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
