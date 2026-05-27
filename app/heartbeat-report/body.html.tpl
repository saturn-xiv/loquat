<h3> {{ .created_at.Format "2006-01-02T15:04:05Z07:00" }} </h3>
<hr />
<ul>
    {{ range $dev, $val := .items }}
    <li>
        Ethernet {{ $dev }}({{ $val.label }}) is {{ if $val.ok }}<span style="color: green;">online</span>{{ else }}<span style="color: red;">offline</span>{{ end }}. <span>{{ $val.memo }}</span>
    </li>
    {{ end }}
<ul>
