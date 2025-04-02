# syntax = docker/dockerfile:experimental

FROM ubuntu:22.04

# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and Python
RUN apt-get update && apt-get install -y \
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
    ninja && \
    ninja install

# Install OpenSplat
RUN git clone https://github.com/pierotofy/OpenSplat OpenSplat && \
    cd OpenSplat && \
    wget "https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-2.6.0+cpu.zip" && \
    unzip libtorch-cxx11-abi-shared-with-deps-2.6.0+cpu.zip -d /usr/local/ && \
    mkdir build && \
    cd build && \
    cmake -DCMAKE_PREFIX_PATH=/usr/local/libtorch/ .. -GNinja && \
    ninja && \
    ninja install

# Update LD_LIBRARY_PATH for libtorch
ENV LD_LIBRARY_PATH=/usr/local/libtorch/lib:$LD_LIBRARY_PATH

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r requirements.txt

ENV PYTHONPATH="${PYTHONPATH}:/app"
ARG PYTHONPATH=/app

COPY ./app /app

RUN mkdir -p /app/uploads /app/results

EXPOSE 8000

# Default command to run the application with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
