# Use official Odoo 17 image as base
FROM odoo:17.0

# Switch to root user to install packages
USER root

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3-dev \
    libxml2-dev \
    libxslt1-dev \
    libldap2-dev \
    libsasl2-dev \
    libjpeg-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages that commonly fail on Windows
RUN pip3 install --no-cache-dir \
    lxml \
    Pillow \
    psycopg2-binary \
    reportlab \
    num2words \
    babel \
    decorator \
    docutils \
    gevent \
    greenlet \
    Jinja2 \
    MarkupSafe \
    passlib \
    polib \
    psutil \
    pydot \
    python-dateutil \
    pytz \
    requests \
    werkzeug \
    xlrd \
    xlsxwriter

# Switch back to odoo user
USER odoo

# Set working directory
WORKDIR /mnt/extra-addons