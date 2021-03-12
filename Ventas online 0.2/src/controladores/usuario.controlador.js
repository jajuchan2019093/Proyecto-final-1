'use strict'

var Usuario = require('../modelos/usuario.modelo');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../servicios/jwt')

const { model } = require('mongoose');

function Admin(req, res) {
    var userModel = new Usuario();

    userModel.nombre = 'ADMIN';
    userModel.password = '123456';
    userModel.rol = 'ROL_ADMIN'

    Usuario.find({

        $or: [
            { nombre: userModel.nombre }
        ]

    }).exec((err, adminEncontrado) => {
        if (err) return console.log('Error al crear el Admin');

        if (adminEncontrado.length >= 1) {

            return console.log("El admin ya se creo")

        } else {
            bcrypt.hash('123456', null, null, (err, passwordEncriptada) => {

                userModel.password = passwordEncriptada;


                userModel.save((err, adminGuardado) => {

                    if (err) return console.log('error en la peticion del Admin')

                    if (adminGuardado) {
                        console.log('Admin Creado ')

                    } else {
                        console.log('Error al crear el Admin')
                    }
                })
            })
        }
    })
}

function AgregarUsuario(req, res) {
    var usuarioModel = new Usuario();
    var params = req.body;

    if (req.user.rol != 'ROL_ADMIN') {
        return res.status(500).send({ mensaje: 'No posee los permisos para agregar un Usuario' })
    }

    if (params.nombre && params.password) {

        usuarioModel.nombre = params.nombre,
         usuarioModel.rol = 'ROL_CLIENTE',

            Usuario.find({

                $or: [

                    { nombre: params.nombre },

                ]


            }).exec((err, UsuarioEncontrado) => {
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });

                if (UsuarioEncontrado && UsuarioEncontrado.length >= 1) {
                    return res.status(500).send({ mensaje: 'El usuario ya existe' })

                } else {
                    bcrypt.hash(params.password, null, null, (err, passwordEncriptada) => {

                        usuarioModel.password = passwordEncriptada;

                        usuarioModel.save((err, usurioGuardado) => {
                            if (err) return res.status(500).send({ mensaje: 'Error al guardar el usuario' })

                            if (usurioGuardado) {
                                return res.status(500).send({ usurioGuardado })

                            } else {
                                return res.status(500).send({ mensaje: 'no se ha podido registrar el usuario' })
                            }
                        })
                    })
                }


            })

    } else {
        return res.status(500).send({ mensaje: 'llene todos los parametros necesarios' })
    }


}

function login(req, res) {
    
    var params = req.body;

    Usuario.findOne({ nombre: params.nombre }, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });

        if (usuarioEncontrado) {
            bcrypt.compare(params.password, usuarioEncontrado.password, (err, passVerificada) => {
                if (passVerificada) {
                    if (params.getToken === 'true') {

                        if (usuarioEncontrado.rol === 'ROL_CLIENTE') {

                            tk = usuarioEncontrado._id 
                            
                            return res.status(200).send({
                                
                                token: jwt.createToken(usuarioEncontrado),mensaje:'aquí iran las compras del usuario'

                            })

                            

                        } else {
                            return res.status(200).send({
                                token: jwt.createToken(usuarioEncontrado)
                            })
                        }



                    } else {
                        usuarioEncontrado.password = undefined;
                        return res.status(200).send({ usuarioEncontrado });
                    }
                } else {
                    return res.status(500).send({ mensaje: 'El usuario no se a podido indentificar' })
                }

            })
        } else {
            return res.status(500).send({ mensaje: 'Error al buscar el Usuario' })
        }
    })

}

function modificarRol(req, res) {
    var params = req.body;
    var idUsuario = req.params.id

    delete params.password;
    delete params.nombre;

    if (req.user.rol = ! 'ROL_ADMIN') {
        return res.status(500).send({ mensaje: 'No posee los permisos para modificar el rol' })
    }

    Usuario.findByIdAndUpdate(idUsuario, params, { new: true }, (err, empleadoActualizado) => {
        if (err) return res.status(500).send({ mensaje: 'error en la peticion' });

        if (!empleadoActualizado) return res.status(500).send({ mensaje: 'no se ha podido editar el empleado' })
        if (empleadoActualizado.rol != 'ROL_CLIENTE') return res.status(500).send({ mensaje: 'No posee el permiso para editar el rol de este usuario' })

        if (empleadoActualizado) {
            return res.status(200).send({ empleadoActualizado });
        }

    })


}

function EditarUsuario(req, res) {
    var params = req.body;
    var idUsuario = req.params.id;

    delete params.password;

    if (req.user.sub != idUsuario) {

        if (req.user.rol != 'ROL_ADMIN') {
            return res.status(500).send({ mensaje: 'No posee los permisos para editar un usuario' })
        }
    }

    Usuario.find({ nombre: params.nombre }).exec((err, UsuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });



        if (UsuarioEncontrado && UsuarioEncontrado.length >= 1) {
            return res.status(500).send({ mensaje: 'El nombre al que desea modificar ya existe ' })
        } else {

            Usuario.findOne({ _id: idUsuario }).exec((err, usuarioEncontrado) => {
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });

                if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'No existen los datos' });

                if (usuarioEncontrado.rol != 'ROL_CLIENTE') return res.status(500).send({ mensaje: 'No posee el permiso para editar este usuario' })
                Usuario.findByIdAndUpdate(idUsuario, params, { new: true }, (err, usuarioActualizado) => {
                    if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });

                    if (!usuarioActualizado) return res.status(500).send({ mensaje: 'No se ha podido editar el usuario' });

                    if (usuarioActualizado) return res.status(200).send({ usuarioActualizado })
                })
            })


        }
    })
}

function eliminarUsuario(req, res) {
    var params = req.body;
    var idUsuario = req.params.id

    if (req.user.rol != 'ROL_ADMIN') {
        return res.status(500).send({ mensaje: 'No posee los permisos para eliminar un usuario' })
    }

    Usuario.findOne({ _id: idUsuario }).exec((err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'No se han encontrado los datos' })

        if (usuarioEncontrado.rol != 'ROL_CLIENTE') return res.status(500).send({ mensaje: 'No posee los permisos para eliminar este usuario' });

        Usuario.findByIdAndDelete(idUsuario, (err, usuarioEliminado) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });
            if (!usuarioEliminado) return res.status(500).send({ mensaje: 'No se ha podido eliminar el usuario' });
          

            if (usuarioEliminado) return res.status(200).send({ mensaje: 'Se ha eliminado el usuario' })
        })

    })


}



module.exports = {
    Admin,
    AgregarUsuario,
    login,
    modificarRol,
    EditarUsuario,
    eliminarUsuario,
  
}