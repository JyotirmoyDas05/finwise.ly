import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { cookies } from 'next/headers'

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const auth = getAuth()

export async function getSession() {
  try {
    // Get the session cookie
    const cookiesList = await cookies()
    const sessionCookie = cookiesList.get('session')

    if (!sessionCookie?.value) {
      console.log('No session cookie found')
      return {
        user: {
          id: 'default',  // Provide a default user ID for now
          email: '',
          name: 'Guest',
          image: '',
        },
      }
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true)
    
    if (!decodedClaims.uid) {
      console.log('No UID in decoded claims')
      return {
        user: {
          id: 'default',  // Provide a default user ID for now
          email: '',
          name: 'Guest',
          image: '',
        },
      }
    }

    return {
      user: {
        id: decodedClaims.uid,
        email: decodedClaims.email || '',
        name: decodedClaims.name || '',
        image: decodedClaims.picture || '',
      },
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return {
      user: {
        id: 'default',  // Provide a default user ID for now
        email: '',
        name: 'Guest',
        image: '',
      },
    }
  }
} 