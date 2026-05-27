{{ .hostname }} {{ .created_at.Format "2006-01-02T15:04:05Z07:00" }}: {{ if .ok }} GREEN {{ else }} RED {{ end }}
