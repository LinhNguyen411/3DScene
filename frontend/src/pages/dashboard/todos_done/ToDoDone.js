import { Button, Container, Row, Col, Card } from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import DataService from "./ToDoService";
import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate"

export default function ToDoDone() {

  const [refresh, setRefresh] = useState(0);
  const [ItemsTodos, setItemsTodos] = useState([]);
  const [pageCount, setpageCount] = useState(5);
  const [newPage, setnewPage] = useState(1);
  const itemsPerPage = 20;

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
      <span>
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
    DataService.getTodos(true, newPage, itemsPerPage)
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
                <Card.Title>List done</Card.Title>
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
