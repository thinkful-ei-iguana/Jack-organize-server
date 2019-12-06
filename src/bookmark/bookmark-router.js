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
    const {title, url, description, rating} = reqBody;
    if(!title){
        return res.status(400).send('title required');
    }
    if(!url){
        return res.status(400).send('url required');
    }
    if(!description){
        return res.status(400).send('description required');
    }
    if(!Number.isInteger(rating) || 1 > rating || rating > 5){
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
        res.status(201)
        .location('insert url')
        .json(newItem)
        
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) =>{
        const {id} = req.params;
        let itemres = {}
        store.bookmarks.forEach(item =>{ if (item.id === id){itemres = item; return item}});
        if(itemres === undefined){
            logger.error(`Card with id ${id} not found.`);
            return res.status(404)
            .send('bookmark not found')
        }
        res.send(store.bookmarks);
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
        console.log(store.bookmarks);
        store.bookmarks =store.bookmarks.filter(item =>{
            if(item.id !== id){
                return item;
            }
        })
        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        res.status(204)
        .end();
    })

module.exports = bookmarkRouter