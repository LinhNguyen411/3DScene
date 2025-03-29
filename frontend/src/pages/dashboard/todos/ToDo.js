import { Button, Container, Row, Col, Card } from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import DataService from "./ToDoService";
import { useState, useEffect } from "react";
import AddToDo from "./add_todo/AddToDo"
import ReactPaginate from "react-paginate"

export default function ToDo() {

  const [refresh, setRefresh] = useState(0);
  const [ItemsTodos, setItemsTodos] = useState([]);
  const [pageCount, setpageCount] = useState(5);
  const [newPage, setnewPage] = useState(1);


  const itemsPerPage = 20;

  const handleMakeDone = (id, e) => {

    e.preventDefault();

    const data = { id: id,   
      todo_in: {
      is_done: true
    }
    }
 
    DataService.makeDoneToDo(data)
    .then(() => {
      setRefresh(Date.now())
    })
    .catch((error) => {
       //error
    });
  };

  const handleDelete = (id, e) => {

    e.preventDefault();
 
    DataService.deleteToDo(id)
    .then(() => {
      setRefresh(Date.now())
    })
    .catch((error) => {
       //error
    });
  };

  function FormatterLinkDeleteToDo(
    cell,
    row,
    rowIndex,
    formatExtraData
  ) {
    return (
      <span className="table-buttons">
        <Button variant="link" size="sm" 
        onClick={(e) => handleMakeDone(formatExtraData[rowIndex].id, e)}
        >Done</Button>
        <Button variant="link" size="sm" 
        onClick={(e) => handleDelete(formatExtraData[rowIndex].id, e)}
        >Delete</Button>
      </span>
    );
  }

  const columns = [{
    dataField: 'id',
    text: '#'
  }, {
    dataField: 'title',
    text: 'Title'
  }, {
    dataField: '',
    text: 'Actions',
    formatter: FormatterLinkDeleteToDo,
    formatExtraData: ItemsTodos,
    align: 'right',
    headerAlign: 'right',
  }];

  useEffect(() => {
    DataService.getTodos(false, newPage, itemsPerPage)
    .then(
      response => {
      setItemsTodos(response.data.items)
      setpageCount(Math.ceil(response.data.total / itemsPerPage));
    }
    )
    .catch((error) => {
      // console.log("error")
    });
  }, [refresh, newPage]);

  const handlePageClick = (event) =>{
    setnewPage(event.selected+1);
  };
  

  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12}>
            <Card>
              <Card.Body>
                <Card.Title>
                <Container fluid className="p-0">
                  <Row>
                  <Col xs={6}>List to do</Col>
                  <Col xs={6} className="d-flex justify-content-end"><AddToDo tableRefresh={setRefresh}/></Col>
                  </Row>
                  </Container></Card.Title>
                <BootstrapTable bordered={false} hover keyField='id' data={ ItemsTodos } columns={ columns } />
                <ReactPaginate
                  className="pagination justify-content-center"
                  nextLabel=">"
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={2}
                  pageCount={pageCount}
                  previousLabel="<"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  previousClassName="page-item"
                  previousLinkClassName="page-link"
                  nextClassName="page-item"
                  nextLinkClassName="page-link"
                  breakLabel="..."
                  breakClassName="page-item"
                  breakLinkClassName="page-link"
                  containerClassName="pagination"
                  activeClassName="active"
                  renderOnZeroPageCount={null}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
