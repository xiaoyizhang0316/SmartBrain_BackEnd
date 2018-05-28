const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const app = express();

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '',
    database : 'smartbrain'
  }
});

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
	res.send(database.users);
})

app.post('/signin',(req,res) => {
	db.select('email','hash').from('login')
	.where('email','=',req.body.email)
		.then(data => {
			if(bcrypt.compareSync(req.body.password, data[0].hash)){
				return db.select('*').from('users').where('email','=',req.body.email)
				.then(user => {
					res.json(user[0]);
				})
				.catch(err => res.status('400').json('Unable to get user'))
			}
			else
			res.status('400').json('wrong password');
		}).catch(err => res.status('400').json( 'password'))

})

app.post('/register',(req,res) => {
	const {email, name, password} = req.body;
	const hash = bcrypt.hashSync(password);
		db.transaction(trx => {
			trx.insert({
				hash:hash,
				email:email
			})
			.into('login')
			.returning('email')
			.then(loginEmail=>{
				return trx('users')
					.returning('*')
					.insert({
						email:loginEmail[0],
						name:name,
						joint: new Date() 
				}).then(user => {
					res.json(user[0]);
				})
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
			.catch(err => res.status(400).json('unable to register'));
	
})

app.get('/profile/:id', (req,res) => {
	const { id } = req.params;
	let found = false;
	db('users').where({id:id}).then(user => {
		if (user.length)
		res.json(user[0]);
		else
		res.status('400').json('No user found');
	}).catch(err => res.json(err));
})

app.put('/image',(req,res) =>{
	const { id } = req.body;
	db('users')
	.where('id', '=', id)
	.increment('entries',1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0])
	}).catch(err => res.status('400').json('Unable to count'))
})

app.listen(process.env.PORT, () => {
	console.log('connected ${process.env.PORT}');
})