/* eslint-disable no-use-before-define */
/* eslint-disable max-len */
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { v4 } from "uuid";
import { User } from "../entity/User";
import { sendMail } from "../utils/mail";

class AuthController {
    public static async login(req: Request, res: Response): Promise<void> {
        const { nickname, password } = req.body;
        if (!(nickname && password)) {
            res.status(400).end(JSON.stringify({ message: "Nicht alle Felder ausgefüllt!" }));
            return;
        }

        // Get user from database
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.createQueryBuilder("user")
                .addSelect("user.password")
                .where("user.nickname = :nickname", { nickname })
                .getOne();
        } catch (error) {
            res.status(401).end(JSON.stringify({ message: "Falscher Nickname!" }));
            return;
        }

        if (!user) {
            res.status(401).end(JSON.stringify({ message: "Falscher Nickname!" }));
            return;
        }
        if (!user.checkIfUnencryptedPasswordIsValid(password)) {
            res.status(401).end(JSON.stringify({ message: "Falsches Passwort!" }));
            return;
        }
        const token = jwt.sign(
            {
                userId: user.id,
                nickname: user.nickname,
                isAdmin: user.isAdmin,
            },
            req.app.locals.config.JWT_SECRET,
            { expiresIn: "1h" },
        );

        const response = {
            ...user,
            jwtToken: token,
        };
        response.password = undefined;

        // Send the jwt in the response
        res.send(response);
    }

    public static async renewToken(req: Request, res: Response): Promise<void> {
        const { jwtToken } = req.body;
        if (!(jwtToken)) {
            res.status(400).end(JSON.stringify({ error: "Nicht alle Felder ausgefüllt!" }));
            return;
        }

        let jwtPayload;
        try {
            jwtPayload = (jwt.verify(jwtToken, req.app.locals.config.JWT_SECRET,
                { ignoreExpiration: true }) as any);
        } catch (error) {
            res.status(401).send({ message: "Unbekannter Fehler!" });
            return;
        }
        const {
            userId, nickname, isAdmin,
        } = jwtPayload;
        const newToken = jwt.sign({
            userId, nickname, isAdmin,
        }, req.app.locals.config.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Send the jwt in the response
        res.send({
            user: {
                id: userId,
                nickname,
                isAdmin,
                jwtToken: newToken,
            },
        });
    }

    public static sendPasswordResetMail = async (req: Request, res: Response): Promise<void> => {
        const userRepository = getRepository(User);
        let user: User;
        const token = v4();
        try {
            user = await userRepository.createQueryBuilder("user")
                .addSelect("user.passwordResetToken")
                .where("user.email = :email", { email: req.body.email })
                .getOne();
            user.passwordResetToken = token;
        } catch {
            res.status(404).send({ message: "Ein Benutzer mit dieser Email-Adresse wurde nicht gefunden!" });
            return;
        }
        try {
            await userRepository.save(user);
        } catch {
            res.status(500).send({ message: "Der Token konnte nicht gespeichert werden!" });
            return;
        }
        const link = `${req.app.locals.config.URL}/resetPassword/${token}`;
        const content = `Ein Link zum Zurücksetzen des Passworts für ${user.nickname} wurde angefordert. Wenn das nicht Ihre Absicht war, ignorieren Sie diese Mail einfach. Ihr Passwort wird nicht geändert.`;
        const resetPassword = "Passwort zurücksetzen";
        sendMail(req, req.body.email, {
            btnText: resetPassword,
            btnUrl: link,
            cardSubtitle: "",
            cardTitle: "",
            content,
            secondTitle: "",
            subject: resetPassword,
            subtitle: "angefordert am %s".replace("%s", new Date().toLocaleString()),
            summary: content,
            title: resetPassword,
        }).then(() => {
            res.send({ success: true });
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err);
            res.status(500).send({ message: `Ein Fehler ist aufgetreten: ${err.toString()}` });
        });
    }

    public static setNewPassword = async (req: Request, res: Response): Promise<void> => {
        // Get parameters from the body
        const { password1, password2 } = req.body;
        if (!(password1 && password2)) {
            res.status(400).send({ message: "Nicht alle Felder ausgefüllt!" });
        }

        // Get user from the database
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.createQueryBuilder("user")
                .addSelect("user.password")
                .addSelect("user.passwordResetToken")
                .where("user.passwordResetToken = :passwordResetToken", { passwordResetToken: req.params.resetToken })
                .getOne();
            if (!user) {
                throw Error();
            }
        } catch (e) {
            res.status(404).send({ message: "Der Benutzer wurde nicht gefunden!" });
        }
        if (password1 != password2) {
            res.status(401).send({ message: "Die beiden Passwörter stimmen nicht überein!" });
            return;
        }
        user.password = password2;
        user.passwordResetToken = "";
        user.hashPassword();
        userRepository.save(user);

        res.send({ success: true });
    }
}
export default AuthController;
