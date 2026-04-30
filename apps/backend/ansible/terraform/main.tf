terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── SSH Key Pair ─────────────────────────────────────────────────────────────
resource "aws_key_pair" "draftdock" {
  key_name   = "${var.project_name}-key"
  public_key = file("${path.module}/../.key/draftdock.pub")
}

# ── Security Group ────────────────────────────────────────────────────────────
resource "aws_security_group" "draftdock" {
  name        = "${var.project_name}-sg"
  description = "DraftDock backend security group"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (nginx)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Direct access to API port (optional fallback)
  ingress {
    description = "API direct"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Direct access to WebSocket port (optional fallback)
  ingress {
    description = "WebSocket direct"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Direct access to Collab WebSocket port (Hocuspocus)
  ingress {
    description = "Collab WebSocket direct"
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

# ── EC2 Instance ──────────────────────────────────────────────────────────────
# Ubuntu 24.04 LTS (us-east-1) — update AMI per region if needed
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_instance" "draftdock" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.draftdock.key_name
  vpc_security_group_ids = [aws_security_group.draftdock.id]

  root_block_device {
    volume_size           = 10
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "${var.project_name}-backend"
    Project = var.project_name
  }
}

# ── Inventory file (auto-generated for Ansible) ───────────────────────────────
resource "local_file" "inventory" {
  content  = <<-EOT
    [draftdock]
    ${aws_instance.draftdock.public_ip} ansible_user=ubuntu ansible_ssh_private_key_file=../.key/draftdock.pem ansible_ssh_common_args='-o StrictHostKeyChecking=no'
  EOT
  filename = "${path.module}/../inventory.ini"
}
