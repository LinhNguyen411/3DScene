# syntax = docker/dockerfile:experimental

FROM ubuntu:22.04

# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and Python
RUN apt-get update && apt-get install -y \
    libpq-dev \
    wget \
    python3 \
    python3-pip \
    ffmpeg \
    git \
    build-essential \
    libboost-program-options-dev \
    libboost-graph-dev \
    libboost-system-dev \
    libeigen3-dev \
    libflann-dev \
    libfreeimage-dev \
    libmetis-dev \
    libgoogle-glog-dev \
    libgtest-dev \
    libgmock-dev \
    libsqlite3-dev \
    libglew-dev \
    qtbase5-dev \
    libqt5opengl5-dev \
    libcgal-dev \
    libceres-dev \
    libopencv-dev \
    unzip \
    gcc-10 \
    g++-10 \
    cmake \
    ninja-build \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set compilers to gcc-10 and g++-10
ENV CC=/usr/bin/gcc-10 \
    CXX=/usr/bin/g++-10 \
    CUDAHOSTCXX=/usr/bin/g++-10

# (Optional) Create a symlink so that "python" points to "python3"
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install COLMAP
RUN git clone https://github.com/colmap/colmap.git && \
    cd colmap && \
    mkdir build && \
    cd build && \
    cmake .. -GNinja && \
    ninja -j2 && \
    ninja install

# Install OpenSplat
RUN git clone https://github.com/pierotofy/OpenSplat OpenSplat && \
    cd OpenSplat && \
    wget "https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-2.6.0%2Bcpu.zip" && \
    unzip libtorch-cxx11-abi-shared-with-deps-2.6.0+cpu.zip -d /usr/local/ && \
    mkdir build && \
    cd build && \
    cmake -DCMAKE_PREFIX_PATH=/usr/local/libtorch/ .. -GNinja && \
    ninja -j2 && \
    ninja install

# Update LD_LIBRARY_PATH for libtorch
ENV LD_LIBRARY_PATH=/usr/local/libtorch/lib:$LD_LIBRARY_PATH


# Install Go
RUN wget https://go.dev/dl/go1.24.2.linux-amd64.tar.gz && \
    rm -rf /usr/local/go && \
    tar -C /usr/local -xzf go1.24.2.linux-amd64.tar.gz


# Set Go environment
ENV PATH="/usr/local/go/bin:$PATH"
ENV PATH="/root/go/bin:$PATH"
ENV GOPATH="/root/go"

# Clone gsbox repo and build the app
RUN git clone https://github.com/gotoeasy/gsbox.git gsbox && \
    cd gsbox && \
    go install .

WORKDIR /code/app

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app
ARG PYTHONPATH=/code/app/

ENV PYTHONPATH "${PYTHONPATH}:/code"

RUN rm -rf /ceres-solver /colmap /glomap /OpenSplat /gsbox \
    && rm -rf /go1.24.2.linux-amd64.tar.gz \
    && rm -rf /cudss-local-repo-ubuntu2204-0.5.0_0.5.0-1_amd64.deb

EXPOSE 8000

#CMD ["uvicorn", "main:app", "--reload", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]
