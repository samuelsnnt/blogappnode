//Importando módulos/bibliotecas =>
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const admin = require('./routes/admin');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
require('./models/Postagem');
const Postagem = mongoose.model('postagens');
require('./models/Categoria');
const Categoria = mongoose.model('categorias');
const usuarios = require('./routes/usuario');
const passport = require('passport')
require('./config/auth')(passport)

//Configurações:
    // Sessão
        app.use(session({
            secret: 'cursoNode',
            resave: true,
            saveUninitialized: true
        }));

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(flash());
    // Middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user || null;
            next();
        })
    // Body-parser
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());
    // Handlebars
        app.engine('handlebars', handlebars.engine({defaultLayout: 'main', runtimeOptions: { allowProtoPropertiesByDefault: true, allowProtoMethodsByDefault: true,},}))
        app.set('view engine', 'handlebars')
    // Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect('mongodb://localhost/blogapp').then(() => {
            console.log('Conectado ao banco de dados!')
        }).catch((error) => {
            console.log('Houve um erro: '+error)
        });
    // Public
        app.use(express.static(path.join(__dirname,'public')))

//Rotas:
app.get('/', (req, res) => {
    Postagem.find().populate('categoria').sort({data: 'desc'}).then((postagens) => {
        res.render('index', {postagens})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno: '+err)
        res.redirect('/404')
    })
});

app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({slug: req.params.slug}).then((postagem) => {
        if(postagem){
            res.render('postagem/index', {postagem})
        }else{
            req.flash('error_msg', 'Esta postagem não existe!')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno: '+err)
        res.redirect('/')
    })
});

app.get('/categorias', (req, res) => {
    Categoria.find().then((categorias) => {
        res.render('categorias/index', {categorias})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao lista as categorias: '+err)
        res.redirect('/')
    })
})

app.get('/categorias/:slug', (req, res) => {
    Categoria.findOne({slug: req.params.slug}).then((categoria) => {
        if(categoria){
            Postagem.find({categoria: categoria._id}).then((postagens) => {
                res.render('categorias/postagens', {postagens: postagens, categoria: categoria});
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao listar os posts!');
                res.redirect('/');
            })
        }else{
            req.flash('error_msg', 'Esta categoria não existe!')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao carregar a página desta categoria: '+err)
        res.redirect('/')
    })
})

app.get('/404', (req, res) => {
    res.send('Erro 404!')
});

//Grupo de Rotas
app.use('/admin', admin)
app.use('/usuarios', usuarios)


//Outros:




const PORT = process.env.PORT || 8089;
app.listen(PORT, () => {
    console.clear();
    console.log('Servidor ligado com sucesso!')
});