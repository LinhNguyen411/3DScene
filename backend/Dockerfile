# syntax = docker/dockerfile:experimental

FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

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
    libatlas-base-dev \
    libsuitesparse-dev \
    libopencv-dev \
    unzip \
    gcc-10 \
    g++-10 \
    ninja-build \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Download and install newer CMake version
RUN wget https://github.com/Kitware/CMake/releases/download/v3.28.3/cmake-3.28.3-linux-x86_64.sh \
    && chmod +x cmake-3.28.3-linux-x86_64.sh \
    && ./cmake-3.28.3-linux-x86_64.sh --skip-license --prefix=/usr/local \
    && rm cmake-3.28.3-linux-x86_64.sh

ENV PATH=/usr/local/bin:$PATH

# Install CUDSS
RUN wget https://developer.download.nvidia.com/compute/cudss/0.5.0/local_installers/cudss-local-repo-ubuntu2204-0.5.0_0.5.0-1_amd64.deb \
    && dpkg -i cudss-local-repo-ubuntu2204-0.5.0_0.5.0-1_amd64.deb \
    && cp /var/cudss-local-repo-ubuntu2204-0.5.0/cudss-*-keyring.gpg /usr/share/keyrings/ \
    && apt-get update \
    && apt-get -y install cudss \
    && rm cudss-local-repo-ubuntu2204-0.5.0_0.5.0-1_amd64.deb

# Set environment variables
ENV CUDSS_DIR=/usr/local/cudss \
    PATH=/usr/local/cudss/bin:$PATH \
    LD_LIBRARY_PATH=/usr/local/cudss/lib:$LD_LIBRARY_PATH \
    CC=/usr/bin/gcc-10 \
    CXX=/usr/bin/g++-10 \
    CUDAHOSTCXX=/usr/bin/g++-10

# Fix C++ header includes
RUN sed -i 's/#include_next /#include /g' /usr/include/c++/10/cmath \
    && sed -i 's/#include_next /#include /g' /usr/include/c++/10/cstdlib \
    && find /usr/include/c++/10/bits -type f -exec sed -i 's/#include_next /#include /g' {} +

# Install Ceres solver with CUDA support
RUN git clone --recursive https://github.com/ceres-solver/ceres-solver.git \
    && cd ceres-solver \
    && mkdir build && cd build \
    && cmake -DBUILD_TESTING=OFF -DBUILD_EXAMPLES=OFF -DCMAKE_CUDA_ARCHITECTURES="75;86;89" .. -GNinja \
    && ninja && ninja install \
    && cd ../.. \
    && rm -rf ceres-solver

# Install COLMAP with CUDA support
RUN git clone https://github.com/colmap/colmap.git \
    && cd colmap \
    && mkdir build && cd build \
    && cmake -DCMAKE_CUDA_ARCHITECTURES="75;86;89" .. -GNinja \
    && ninja && ninja install \
    && cd ../.. \
    && rm -rf colmap

# Install GloMap
RUN git clone https://github.com/colmap/glomap.git \
    && cd glomap \
    && mkdir build && cd build \
    && cmake -DCMAKE_CUDA_ARCHITECTURES="75;86;89" .. -GNinja \
    && ninja && ninja install \
    && cd ../.. \
    && rm -rf glomap

# Install PyTorch with CUDA
RUN curl -o libtorch-cxx11-abi-shared-with-deps-2.6.0+cu124.zip https://download.pytorch.org/libtorch/cu124/libtorch-cxx11-abi-shared-with-deps-2.6.0%2Bcu124.zip \
    && unzip libtorch-cxx11-abi-shared-with-deps-2.6.0+cu124.zip -d /usr/local/ \
    && rm libtorch-cxx11-abi-shared-with-deps-2.6.0+cu124.zip

ENV LD_LIBRARY_PATH=/usr/local/libtorch/lib:$LD_LIBRARY_PATH

# Install OpenSplat with CUDA support
RUN git clone https://github.com/pierotofy/OpenSplat OpenSplat \
    && cd OpenSplat \
    && mkdir build && cd build \
    && cmake -DUSE_CUDSS=ON -DCMAKE_PREFIX_PATH=/usr/local/libtorch/ -DCMAKE_CUDA_ARCHITECTURES="75;86;89" .. \
    && make -j$(nproc) \
    && make install \
    && cd ../.. \
    && rm -rf OpenSplat

# Create Python symlink
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install Go
RUN wget https://go.dev/dl/go1.24.2.linux-amd64.tar.gz \
    && rm -rf /usr/local/go \
    && tar -C /usr/local -xzf go1.24.2.linux-amd64.tar.gz \
    && rm go1.24.2.linux-amd64.tar.gz

# Set Go environment
ENV PATH="/usr/local/go/bin:$PATH"
ENV PATH="/root/go/bin:$PATH"
ENV GOPATH="/root/go"

# Clone gsbox repo and build the app
RUN git clone https://github.com/gotoeasy/gsbox.git gsbox \
    && cd gsbox \
    && go install . \
    && cd .. \
    && rm -rf gsbox

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