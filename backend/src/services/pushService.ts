import webPush from 'web-push';
import db from '../config/db';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@minha-cidade.local';

if (publicKey && privateKey) {
    webPush.setVapidDetails(vapidSubject, publicKey, privateKey);
}

interface StoredPushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export const getVapidPublicKey = (): string | undefined => publicKey;

export const sendPushNotification = (
    userId: number,
    payload: { title: string; body: string; url?: string }
): void => {
    if (!publicKey || !privateKey) {
        return;
    }

    db.all(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
        [userId],
        (error, subscriptions: StoredPushSubscription[]) => {
            if (error) {
                console.error('Erro ao buscar inscrições de notificação:', error);
                return;
            }

            for (const subscription of subscriptions) {
                void webPush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth
                        }
                    },
                    JSON.stringify(payload)
                ).catch((pushError: { statusCode?: number }) => {
                    if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                        db.run(
                            'DELETE FROM push_subscriptions WHERE endpoint = ?',
                            [subscription.endpoint]
                        );
                        return;
                    }

                    console.error('Erro ao enviar notificação push:', pushError);
                });
            }
        }
    );
};