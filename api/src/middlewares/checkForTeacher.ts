import { NextFunction, Request, Response } from "express";
import * as i18n from "i18n";
import { isTeacher } from "../utils/helpers";

export async function checkForTeacher(req: Request,
    res: Response, next: NextFunction): Promise<void> {
    if (await isTeacher(res.locals.jwtPayload.userId)) {
        next();
    } else {
        res.status(401).send({ message: i18n.__("errors.notAllowed") });
    }
}