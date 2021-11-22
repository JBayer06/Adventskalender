import { Request, Response, Router } from "express";
import auth from "./auth";
import users from "./users";
import tasks from "./tasks";
import kiosk from "./kiosk";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/tasks", tasks);
routes.use("/kiosk", kiosk);
routes.get("/testmode", (req: Request, res: Response) => {
    if (req.app.locals.config.TEST_MODE) {
        res.send(`
        <!DOCTYPE html>
        <html>
            <body>
                <button onclick='document.cookie = "forceDay="+parseInt(prompt("Aktueller Tag des Dezembers als Zahl (z.B. 3 oder 21)"));window.location.reload()'>Aktuellen Tag setzen</button>
                <button onclick='document.cookie = "forceDay= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";window.location.reload()'>Zurücksetzen</button>
                <br><br>
                <script>
                    let day = /forceDay=(\\d*)/.exec(document.cookie);
                    day = day?.[1];
                    document.write("Aktueller Tag: " + (day ? day : "nicht gesetzt"));
                </script>
            </body>
        </html>
        `);
    } else {
        res.send("Test Mode is not enabled!");
    }
});

export default routes;
