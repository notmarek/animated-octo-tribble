import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js" 
import http from "http"

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join('public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.set("secret", new TextEncoder().encode('verysecretkeyusedtosignthejwttoken'))
app.set('port', 3000);
let server = http.createServer(app);
server.listen(app.get("port"));
server.on('listening', () => console.log("running on http://127.0.0.1:3000"));
