output "instance_public_ip" {
  description = "Public IP address of the DraftDock backend EC2 instance"
  value       = aws_instance.draftdock.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.draftdock.public_dns
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.draftdock.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i .key/draftdock.pem ubuntu@${aws_instance.draftdock.public_ip}"
}
