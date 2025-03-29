import { Button, Modal, Form} from "react-bootstrap";
import DataService from "./AddToDoService";
import { useState } from "react";

export default function ToDo({tableRefresh }) {

    const [isShowModal, setisShowModal] = useState(false);
    const [isShowValidationErrorEmpty, setisShowValidationErrorEmpty] = useState(false)
    const [isShowValidationErrorTextTooLongue, setisShowValidationErrorTextTooLongue] = useState(false)
    const [TitleForm, setTitleForm] = useState("");
 
    const clearData = () => {
        setTitleForm("")
    }
    const clearErrors = () => {
        setisShowValidationErrorEmpty(false);
        setisShowValidationErrorTextTooLongue(false)
    }

    const handleClose= () => {
        setisShowModal(false)
        clearErrors()
        clearData()
    };
    const handleShow = () => {
        setisShowModal(true);
    };

    const data = {title: TitleForm}
    const handleAdd = () => {
      if (TitleForm.length < 1) {
        clearErrors()
        setisShowValidationErrorEmpty(true)
      }
      else if (TitleForm.length > 250) {
        clearErrors()
        setisShowValidationErrorTextTooLongue(true)
        console.log("too longue")
      }
      else {DataService.addDoneToDo(data)
        .then(() => {
          setisShowModal(false);
          clearData()
          tableRefresh(Date.now())
        })
      
        .catch((error) => {
           //error
        });
      };
    }


      

    return (
        <>
        <Button size="sm" onClick={handleShow}>Add To Do</Button>
        <Modal show={isShowModal} onHide={handleClose} centered>
              <Modal.Header>
              <Modal.Title>Add To Do</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Title<span className="text-danger">*</span> (Maximum 250 characters)
                    </Form.Label>
                    <Form.Control
                      as="textarea" rows={4}
                      onChange={(event) => setTitleForm(event.target.value)}
                      value={TitleForm}
                      isInvalid={isShowValidationErrorEmpty || isShowValidationErrorTextTooLongue}
                    />
                    <Form.Text className={
                    "text-danger " +
                    (isShowValidationErrorEmpty ? "" : "d-none")
                  }>
                      This field can't be empty.
                    </Form.Text>
                    <Form.Text className={
                    "text-danger " +
                    (isShowValidationErrorTextTooLongue ? "" : "d-none")
                  }>
                      The maximum number of characters is 250.
                    </Form.Text>
                  </Form.Group>
                  
                </Form>
              </Modal.Body>
              <Modal.Footer  >
              <Button
                  onClick={handleClose}
                >Annuler</Button>
              <Button
                  onClick={handleAdd} variant="success"
                >Add</Button>
 
              </Modal.Footer>
            </Modal>
            </>
    )
}



 
 
 

// export default function СonfirmationModal({uuidCouvertureCodenoq, tableRefresh }:IDescriptionModalProp) {
 
// const [show, setShow] = useState(false);
 

// const handleClose= () => {
//        setShow(false)
// };
 

//   const handleShow = () => {
  
//     setShow(true);
// };

// const handleDelete = () => {
 
//   DataService.deleteCouvertureMetier(uuidCouvertureCodenoq)
//   .then(() => {
//     setShow(false);
//     tableRefresh(Date.now())
//   })

//   .catch((error) => {
//      //error
//   });
// };




//   return (
//     <div>
//  <SuperButton
//         icon="trash"
//         size="sqr"
//         variant="secondary"
//         onClick={handleShow}
//       />
//          <Modal show={show} onHide={handleClose}>
//               <Modal.Header closeButton  >
//                 <h6>{TextList.header_modal}</h6>
//               </Modal.Header>
//               <Modal.Body>
//                {TextList.discription_modal}
//               </Modal.Body>
//               <Modal.Footer  >
//               <SuperButton
//                   variant="outline-primary"
//                   size="sm"
//                   label="Annuler"
//                   onClick={handleClose}
//                 />
//               <SuperButton
//                   variant="danger"
//                   size="sm"
//                   label="Supprimer"
//                   onClick={handleDelete}
//                 />
 
//               </Modal.Footer>
//             </Modal>
 
//     </div>
//   );
// }