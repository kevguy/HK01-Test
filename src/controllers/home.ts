import { Request, Response } from 'express';

/**
 * GET /
 * Home page.
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
export let index = (req: Request, res: Response) => {
  res.locals.mode = 'index';
  res.render('home', {
    title: 'Home'
  });
};
