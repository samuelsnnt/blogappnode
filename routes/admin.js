const express = require('express');
const router = express.Router(); // Criar rotas com um sufixo
const mongoose = require('mongoose');
require('../models/Categoria');
const Categorias = mongoose.model('categorias');
require('../models/Postagem');
const Postagens = mongoose.model('postagens');
const {eAdmin} = require('../helpers/eAdmin');

router.get('/', eAdmin, (req, res) => {
    res.render('admin/index')
})

router.get('/posts', eAdmin, (req, res) => {
    res.send('Página de posts')
});

router.get('/categorias', eAdmin, (req, res) => {
    Categorias.find().sort({date: 'desc'}).then((categorias) => {
        res.render('admin/categorias', {categorias: categorias})
    }).catch((error) => {
        req.flash('error_msg', 'Houve um erro ao listar as categorias')
        res.redirect('/admin')
    })
});

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategoria')
});

router.post('/categorias/nova', eAdmin, (req, res) => {
    Categorias.findOne({nome: req.body.nome}).then((categoria) => {
        if(categoria){
            req.flash('error_msg', 'Já existe uma categoria com esse nome!');
            res.redirect('/admin/categorias/add');
        }else{
            var erros = []

            if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
                erros.push({texto: 'Nome inválido!'})
            }
            if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
                erros.push({texto: 'Slug inválido!'})
            }
            if(req.body.nome.length < 2){
                erros.push({texto: 'Nome da categoria muito pequeno!'})
            }
            if(erros.length > 0){
                res.render('admin/addcategoria', {erros: erros})
            }else{
                const novaCategoria = {
                nome: req.body.nome,
                slug: req.body.slug
                };
                new Categorias(novaCategoria).save().then(() => {
                    req.flash('success_msg', 'Categoria criada com sucesso!')
                    res.redirect('/admin/categorias')
                }).catch((error) => {
                    req.flash('error_msg', 'Houve um erro ao salvar a categoria, tente novamente!')
                    res.redirect('/admin')
                });
            }
        }
    })
});

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categorias.findOne({_id: req.params.id}).then((categoria) => {
        res.render('admin/editcategorias', {categoria}); // **não é array!**
    }).catch((error) => {
        req.flash('error_msg', 'Esta categoria não existe!')
        res.redirect('/admin/categorias')
    });
});



router.post('/categorias/edit', eAdmin, (req, res) => {
  Categorias.findOne({_id: req.body.id}).then((categoria) => {
    if (!categoria) {
      req.flash('error_msg', 'Categoria não encontrada.');
      return res.redirect('/admin/categorias');
    }
    if (categoria.nome == req.body.nome) {
      req.flash('error_msg', 'Você não pode alterar para o mesmo nome!');
      return res.redirect('/admin/categorias');
    } else if (categoria.slug == req.body.slug) {
      req.flash('error_msg', 'Você não pode alterar para o mesmo slug!');
      return res.redirect('/admin/categorias');
    } else {
      categoria.nome = req.body.nome;
      categoria.slug = req.body.slug;

      categoria.save().then(() => {
        req.flash('success_msg', 'Categoria editada com sucesso!');
        res.redirect('/admin/categorias');
      }).catch((error) => {
        req.flash('error_msg', 'Houve um erro interno ao salvar a edição: ' + error);
        res.redirect('/admin/categorias');
      });
    }
  }).catch((error) => {
    req.flash('error_msg', 'Erro ao editar sua categoria: ' + error);
    res.redirect('/admin/categorias');
  });
});

router.post('/categorias/delete', eAdmin, (req, res) => {
    Categorias.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Categoria deletada com sucesso!');
        res.redirect('/admin/categorias');
      }).catch((error) => {
        req.flash('error_msg', 'Houve um erro interno ao deletar a categoria: ' + error);
        res.redirect('/admin/categorias');
      });
})

router.get('/postagens', eAdmin, (req, res) => {
    Postagens.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) => {
        res.render('admin/postagens', {postagens: postagens})
    }).catch((error) => {
        req.flash('error_msg', 'Houve um erro ao listar as postagens!')
        res.redirect('/admin')
    })
});

router.get('/postagens/add', eAdmin, (req, res) => {
    Categorias.find().then((categorias) => {
        res.render('admin/addpostagem', {categorias})
    }).catch((error) => {
        req.flash('error_msg', 'Houve um erro ao carregar o formulário: '+error)
        res.redirect('/admin')
    });
});

router.post('/postagens/nova', eAdmin, (req, res) => {
    Postagens.find({_id: req.body._id}).then((postagem) => {
        var erros = []
        
        if(req.body.categoria == '0'){
            erros.push({texto: 'Categoria inválida, registre uma categoria!'})
        }
        if(erros.length > 0){
            res.render('admin/addpostagem', {erros})
        }else{
            const novaPostagem = {
                titulo: req.body.titulo,
                slug: req.body.slug,
                descricao: req.body.descricao,
                conteudo: req.body.conteudo,
                categoria: req.body.categoria
            }
            new Postagens(novaPostagem).save().then(() => {
                req.flash('success_msg', 'Postagem criada com sucesso!')
                res.redirect('/admin/postagens')
            }).catch((error) => {
                req.flash('error_msg', 'Houve um erro ao criar sua postagem: ' +error)
                res.redirect('/admin/postagens')
            })
            }
    });
});

router.get('/postagens/edit/:id', eAdmin, (req, res) => {
  Postagens.findOne({ _id: req.params.id }).then((postagem) => {
    if (!postagem) {
      req.flash('error_msg', 'Postagem não encontrada!');
      return res.redirect('/admin/postagens');
    }

    // Agora vamos buscar as categorias
    Categorias.find().then((categorias) => {
      // Renderiza a view só uma vez, passando postagem e categorias
      res.render('admin/editpostagem', {
        postagem,
        categorias
      });
    }).catch((error) => {
      req.flash('error_msg', 'Erro ao listar categorias: ' + error);
      res.redirect('/admin/postagens');
    });
  }).catch((error) => {
    req.flash('error_msg', 'Houve um erro: ' + error);
    res.redirect('/admin/postagens');
  });
});

router.post('/postagem/edit', eAdmin, (req, res) => {
  Postagens.findOne({_id: req.body.id}).then((postagem) => {
    if (!postagem) {
      req.flash('error_msg', 'Postagem não encontrada.');
      return res.redirect('/admin/postagens');
    }
      postagem.titulo = req.body.titulo;
      postagem.slug = req.body.slug;
      postagem.descricao = req.body.descricao;
      postagem.conteudo = req.body.conteudo;
      postagem.categoria = req.body.categoria;

      postagem.save().then(() => {
        req.flash('success_msg', 'Categoria editada com sucesso!');
        res.redirect('/admin/postagens');
      }).catch((error) => {
        req.flash('error_msg', 'Houve um erro interno ao salvar a edição: ' + error);
        res.redirect('/admin/postagens');
      });
  }).catch((error) => {
    req.flash('error_msg', 'Erro ao editar sua categoria: ' + error);
    res.redirect('/admin/categorias');
  });
});

router.post('/categorias/delete', eAdmin, (req, res) => {
    Categorias.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Categoria deletada com sucesso!');
        res.redirect('/admin/categorias');
      }).catch((error) => {
        req.flash('error_msg', 'Houve um erro interno ao deletar a categoria: ' + error);
        res.redirect('/admin/categorias');
      });
});

router.post('/postagens/delete', eAdmin, (req, res) => {
  Postagens.deleteOne({_id: req.body.id}).then(() => {
    req.flash('success_msg', 'Postagem deletada com sucesso!');
    res.redirect('/admin/postagens');
  }).catch((error) => {
    req.flash('error_msg', 'Houve um erro ao deletar a postagem: '+error);
    res.redirect('/admin/postagens');
  });
});


module.exports = router;