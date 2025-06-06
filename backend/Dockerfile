FROM python:3.12

WORKDIR /backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN apt-get update && apt-get install -y postgresql-client

RUN chmod +x /backend/wait-for-postgres.sh

EXPOSE 8000

CMD ["/backend/wait-for-postgres.sh", "sh", "start.sh"]
