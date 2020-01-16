const express = require('express');
const store = require('../store');
const uuid = require('uuid');
const winston = require('winston');
const { NODE_ENV } = require('../config');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

function validateBKM(reqBody, res){
    let {title, url, description, rating} = reqBody;
    rating = parseInt(rating);
    if(!title){
        return res.status(400).send('title required');
    }
    if(!url){
        return res.status(400).send('url required');
    }
    if(!description){
        return res.status(400).send('description required');
    }
    if(!Number.isInteger(rating) || !(1 <= rating) || !(rating <= 5)){
        return res.status(400).send('rating either does not exist or is not a number between 1 and 5')
    }
}

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) =>{
        res.json(store.bookmarks);
    })
    .post(bodyParser, (req, res) =>{
        validateBKM(req.body, res);
        const newItem = {
            id: uuid(),
            title: req.body.title,
            url: req.body.url,
            description: req.body.description,
            rating: req.body.rating
        }
        store.bookmarks.push(newItem)
        return res.status(201)
        .location('insert url')
        .json(newItem)
        
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) =>{
        const {id} = req.params;
        let itemres;

        store.bookmarks.forEach(item =>{ if (item.id === id){itemres = item; return item}});
        if(!itemres){
            logger.error(`Card with id ${id} not found.`);
            return res.status(404)
            .send('bookmark not found')
        }
        res.send(itemres);
    })
    .delete((req, res) =>{
        const {id} = req.params;
        let itemres = {}
        store.bookmarks.forEach(item =>{ if (item.id === id){itemres = item; return item}});
        if(itemres === undefined){
            logger.error(`Card with id ${id} not found.`);
            return res.status(404)
            .send('bookmark not found')
        }
        //console.log(store.bookmarks);
        store.bookmarks = store.bookmarks.filter(item =>{
            if(item.id !== id){
                return item;
            }
        })
        logger.info(`Bookmark with id ${itemres.id} deleted.`);
        res.status(204).send(itemres)
        .end();
    })
    .patch(bodyParser, (req, res) =>{
        const {id} = req.params;
        const title = req.body.title;
        const url = req.body.url;
        const description = req.body.description;
        const rating = req.body.rating;
        if(!id || (!title && !url && !description && !rating)){
            return res.status(400)
        }
        let itemres;
        let index;

        store.bookmarks.forEach(item =>{ if (item.id === id){itemres = item; index = item; return item}});
        if(!itemres){
            logger.error(`Card with id ${id} not found.`);
            return res.status(404)
            .send('bookmark not found')
        }
        if(!!title){
            itemres.title = title;
        }
        if(!!url){
            itemres.url = url;
        }
        if(!!description){
            itemres.description = description;
        }
        if(!!rating){
            itemres.rating = rating;
        }

        store.bookmarks = store.bookmarks.splice(store.bookmarks.findIndex(index), 1, itemres);

        return res.status(204);
    })

module.exports = bookmarkRouter