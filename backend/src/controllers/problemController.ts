import { Request, Response } from 'express';
import db from '../config/db';
import { sendPushNotification } from '../services/pushService';


// CRIAR PROBLEMA
export const createProblem = (req: Request, res: Response) => {
    const { description, latitude, longitude, category_id } = req.body;
    const user = res.locals.auth;

    if (!user) {
        return res.status(401).json({
            message: 'Usuário não autenticado'
        });
    }

    if (
        !description ||
        typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !category_id
    ) {
        return res.status(400).json({
            message: 'Descrição, coordenadas válidas e categoria são obrigatórios'
        });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
        INSERT INTO problems
        (description, photo, latitude, longitude, status, user_id, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            description,
            photo,
            latitude,
            longitude,
            'Aberto',
            user.id,
            category_id
        ],
        function (err) {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: 'Erro ao criar problema'
                });
            }

            return res.status(201).json({
                message: 'Problema criado com sucesso',
                id: this.lastID
            });
        }
    );
};


// LISTAR TODOS OS PROBLEMAS
export const getProblems = (req: Request, res: Response) => {

    const { category_id, status } = req.query;

    let sql = `
        SELECT *
        FROM problems
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category_id) {
        conditions.push('category_id = ?');
        params.push(category_id);
    }

    if (status) {
        conditions.push('status = ?');
        params.push(status);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: 'Erro ao buscar problemas'
            });
        }

        return res.status(200).json(rows);
    });
};


// BUSCAR UM PROBLEMA
export const getProblemById = (req: Request, res: Response) => {

    const { id } = req.params;

    db.get(
        'SELECT * FROM problems WHERE id = ?',
        [id],
        (err, row) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: 'Erro ao buscar problema'
                });
            }

            if (!row) {
                return res.status(404).json({
                    message: 'Problema não encontrado'
                });
            }

            return res.status(200).json(row);
        }
    );
};


// LISTAR OS PROBLEMAS DO USUÁRIO LOGADO
export const getMyProblems = (req: Request, res: Response) => {

    const user = res.locals.auth;

    if (!user) {
        return res.status(401).json({
            message: 'Usuário não autenticado'
        });
    }

    db.all(
        `
        SELECT *
        FROM problems
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [user.id],
        (err, rows) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: 'Erro ao buscar problemas'
                });
            }

            return res.status(200).json(rows);
        }
    );
};


// ALTERAR STATUS
export const updateProblemStatus = (req: Request, res: Response) => {

    const user = res.locals.auth;
    const { id } = req.params;
    const { status } = req.body;

    if (!user) {
        return res.status(401).json({
            message: 'Usuário não autenticado'
        });
    }

    if (user.role !== 'ADMIN') {
        return res.status(403).json({
            message: 'Apenas administradores podem alterar o status'
        });
    }

    const statuses = [
        'Aberto',
        'Em andamento',
        'Resolvido'
    ];

    if (!statuses.includes(status)) {
        return res.status(400).json({
            message: 'Status inválido'
        });
    }

    db.run(
        `
        UPDATE problems
        SET status = ?
        WHERE id = ?
        `,
        [status, id],
        function (err) {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: 'Erro ao atualizar status'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: 'Problema não encontrado'
                });
            }

            db.get(
                'SELECT user_id, description FROM problems WHERE id = ?',
                [id],
                (lookupError, problem: { user_id: number; description: string } | undefined) => {
                    if (lookupError) {
                        console.error('Erro ao buscar autor do problema para notificação:', lookupError);
                        return;
                    }

                    if (problem) {
                        sendPushNotification(problem.user_id, {
                            title: 'Atualização do seu problema',
                            body: `"${problem.description}" agora está: ${status}.`,
                            url: `/issues/${id}`
                        });
                    }
                }
            );

            return res.status(200).json({
                message: 'Status atualizado com sucesso'
            });
        }
    );
};


// DELETAR PROBLEMA
export const deleteProblem = (req: Request, res: Response) => {

    const user = res.locals.auth;
    const { id } = req.params;

    if (!user) {
        return res.status(401).json({
            message: 'Usuário não autenticado'
        });
    }

    if (user.role !== 'ADMIN') {
        return res.status(403).json({
            message: 'Apenas administradores podem deletar problemas'
        });
    }

    db.run(
        'DELETE FROM problems WHERE id = ?',
        [id],
        function (err) {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: 'Erro ao deletar problema'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: 'Problema não encontrado'
                });
            }

            return res.status(200).json({
                message: 'Problema deletado com sucesso'
            });
        }
    );
};