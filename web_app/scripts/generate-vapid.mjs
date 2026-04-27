/**
 * Gera as chaves VAPID necessárias para Web Push Notifications.
 * Execute: node scripts/generate-vapid.mjs
 * Cole as chaves geradas no .env.local e nas variáveis de ambiente do Vercel.
 */
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\n=== VAPID Keys geradas ===\n')
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + keys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
console.log('VAPID_EMAIL=mailto:admin@fleetflow.com.br')
console.log('\nCole estas variáveis no .env.local e no painel de env vars do Vercel.\n')
