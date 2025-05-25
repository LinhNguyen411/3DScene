# syntax = docker/dockerfile:experimental
FROM nvidia/cuda:12.1.0-devel-ubuntu22.04

# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and Python
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    curl \
    unzip \
    python3.10 \
    python3.10-dev \
    python3.10-distutils \
    ffmpeg \
    libopencv-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
    && python3.10 get-pip.py \
    && rm get-pip.py \
    && ln -s /usr/bin/python3.10 /usr/bin/python \
    && ln -sf $(which pip3.10) /usr/bin/pip

RUN curl -L -o cmake-3.28.3-linux-x86_64.sh https://github.com/Kitware/CMake/releases/download/v3.28.3/cmake-3.28.3-linux-x86_64.sh \
    && chmod +x cmake-3.28.3-linux-x86_64.sh \
    && ./cmake-3.28.3-linux-x86_64.sh --skip-license --prefix=/usr/local \
    && rm cmake-3.28.3-linux-x86_64.sh
    
ENV PATH=/usr/local/bin:$PATH

# Install PyTorch with CUDA
RUN curl -o libtorch-cxx11-abi-shared-with-deps-2.5.1+cu121.zip https://download.pytorch.org/libtorch/cu121/libtorch-cxx11-abi-shared-with-deps-2.5.1%2Bcu121.zip \
    && unzip libtorch-cxx11-abi-shared-with-deps-2.5.1+cu121.zip -d /usr/local/ \
    && rm libtorch-cxx11-abi-shared-with-deps-2.5.1+cu121.zip

ENV LD_LIBRARY_PATH=/usr/local/libtorch/lib:$LD_LIBRARY_PATH

# Install OpenSplat with CUDA support
RUN git clone https://github.com/pierotofy/OpenSplat OpenSplat \
    && cd OpenSplat \
    && mkdir build && cd build \
    && cmake -DCMAKE_PREFIX_PATH=/usr/local/libtorch/ -DCMAKE_CUDA_ARCHITECTURES="75;86;89" .. \
    && make -j$(nproc) \
    && make install \
    && cd ../.. \
    && rm -rf OpenSplat

# Install Go
RUN curl -L -o go1.24.2.linux-amd64.tar.gz https://go.dev/dl/go1.24.2.linux-amd64.tar.gz \
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

RUN git clone https://github.com/facebookresearch/vggsfm.git vggsfm \
    && sed -i 's/max_points_num=163840/max_points_num=16384/' vggsfm/vggsfm/runners/runner.py \
    && sed -i 's/max_tri_points_num=819200/max_tri_points_num=65536/' vggsfm/vggsfm/utils/triangulation.py

WORKDIR /code/app

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

RUN cd /vggsfm \
    && cd /vggsfm \
    && git clone https://github.com/jytime/LightGlue.git dependency/LightGlue \
    && cd dependency/LightGlue/ \
    && python -m pip install -e . \
    && cd ../.. \
    && python -m pip install -e . \
    && cd /code/app \
    && pip install pytorch3d==0.7.5 --no-index --no-cache-dir -f https://dl.fbaipublicfiles.com/pytorch3d/packaging/wheels/py310_cu121_pyt210/download.html


COPY ./app /code/app
ARG PYTHONPATH=/code/app/

ENV PYTHONPATH "${PYTHONPATH}:/code"

RUN rm -rf /ceres-solver /OpenSplat /gsbox \
    && rm -rf /go1.24.2.linux-amd64.tar.gz \
    && rm -rf /cudss-local-repo-ubuntu2204-0.5.0_0.5.0-1_amd64.deb

EXPOSE 8000

#CMD ["uvicorn", "main:app", "--reload", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]