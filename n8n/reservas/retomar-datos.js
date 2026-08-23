// Nodo Code "Retomar datos".
//
// En n8n la salida de cada nodo es la entrada del siguiente, y el nodo de
// Telegram devuelve la respuesta de SU API ({ ok, result: { message_id } }),
// no los datos de la reserva. Sin este nodo, todo lo que viene despues
// evalua $json sobre la respuesta de Telegram:
//
//   - "Requiere aprobacion" lee $json.requiere_revision -> undefined,
//     asi que toda reserva se iba por la rama de confirmada y el loop de
//     aprobacion no corria nunca;
//   - "Tiene email" lee $json.email -> undefined, asi que el mail de
//     confirmacion no se mandaba jamas.
//
// Nada de eso daba error: el workflow terminaba en verde haciendo menos de
// lo que decia hacer.

return [{ json: $('Mensaje al dueno').first().json }];
