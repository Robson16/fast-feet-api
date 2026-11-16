#!/bin/bash
echo "Criando bucket S3 local para o Fast Feet..."
awslocal s3 mb s3://fast-feet
echo "Bucket criado com sucesso!"