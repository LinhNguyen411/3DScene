# syntax = docker/dockerfile:experimental

FROM python:3.9

# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1

WORKDIR /code/app

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app
ARG PYTHONPATH=/code/app/

ENV PYTHONPATH "${PYTHONPATH}:/code"

EXPOSE 8000

#CMD ["uvicorn", "main:app", "--reload", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]