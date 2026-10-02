import { Request, Response } from 'express';
import db from '../config/db';
import { getVapidPublicKey } from '../services/pushService';

interface AuthenticatedUser {
    id: number;
}

export const getPublicKey = (_req: Request, res: Response): void => {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
        res.status(503).json({ message: 'Notificações não configuradas no servidor' });
        return;
    }

    res.status(200).json({ publicKey });
};

export const saveSubscription = (req: Request, res: Response): void => {
    const user = res.locals.auth as AuthenticatedUser | undefined;
    const { endpoint, keys } = req.body ?? {};

    if (!user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
    }

    if (
        typeof endpoint !== 'string' ||
        !endpoint.startsWith('https://') ||
        typeof keys?.p256dh !== 'string' ||
        typeof keys?.auth !== 'string'
    ) {
        res.status(400).json({ message: 'Inscrição de notificação inválida' });
        return;
    }

    db.run(
        `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
            user_id = excluded.user_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth
        `,
        [user.id, endpoint, keys.p256dh, keys.auth],
        (error) => {
            if (error) {
                console.error('Erro ao salvar inscrição de notificação:', error);
                res.status(500).json({ message: 'Não foi possível ativar as notificações' });
                return;
            }

            res.status(201).json({ message: 'Notificações ativadas' });
        }
    );
};

export const removeSubscription = (req: Request, res: Response): void => {
    const user = res.locals.auth as AuthenticatedUser | undefined;
    const { endpoint } = req.body ?? {};

    if (!user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
    }

    if (typeof endpoint !== 'string') {
        res.status(400).json({ message: 'Endpoint de inscrição inválido' });
        return;
    }

    db.run(
        'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
        [user.id, endpoint],
        (error) => {
            if (error) {
                console.error('Erro ao remover inscrição de notificação:', error);
                res.status(500).json({ message: 'Não foi possível desativar as notificações' });
                return;
            }

            res.status(200).json({ message: 'Notificações desativadas' });
        }
    );
};