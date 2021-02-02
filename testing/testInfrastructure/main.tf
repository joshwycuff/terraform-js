terraform {}

variable "content" {
  type = string
  default = ""
}

resource "local_file" "file" {
  filename = "${terraform.workspace}.txt"
  content = var.content
}

output "filename" {
  value = local_file.file.filename
}

output "content" {
  value = local_file.file.content
}
