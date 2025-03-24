# README

## Running Docker Compose

To run the Docker Compose file, follow these steps:

1. Ensure you have Docker and Docker Compose installed on your machine.
2. Navigate to the directory containing your `docker-compose.yml` file.
3. Run the following command to start the services defined in the Docker Compose file:

    ```sh
    docker-compose up -d
    ```
    To stop:
     ```sh
    docker-compose down
    ```

    This command will start all the services defined in the `docker-compose.yml` file.

That script 

## Importing Volume Snapshot
To import a volume snapshot using Docker Desktop, follow these steps:

1. Open Docker Desktop and go to the "Volumes" tab.
2. Find the volume you want to import the snapshot into and click on it.
3. Click on the "Actions" dropdown and select "Import".
4. Choose the snapshot file from your local machine.
5. Click "Open" to start the import process.

The snapshot will be imported into the selected volume.