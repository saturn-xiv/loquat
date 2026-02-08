package nmap

import (
	"encoding/xml"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type NmapRun struct {
	XMLName          xml.Name `xml:"nmaprun"`
	Scanner          string   `xml:"scanner,attr"`
	Args             string   `xml:"args,attr"`
	Start            uint     `xml:"start,attr"`
	StartStr         string   `xml:"startstr,attr"`
	Version          string   `xml:"version,attr"`
	XmlOutPutVersion string   `xml:"xmloutputversion,attr"`
	Verbose          Verbose
	Debugging        Debugging
	Hosts            []Host `xml:"host"`
	RunStats         RunStats
}

type Verbose struct {
	XMLName xml.Name `xml:"verbose"`
	Level   uint     `xml:"level,attr"`
}
type Debugging struct {
	XMLName xml.Name `xml:"debugging"`
	Level   uint     `xml:"level,attr"`
}

type Host struct {
	Status    HostStatus
	Addresses []HostAddress `xml:"address"`
	Hostname  []string      `xml:"hostnames>hostname"`
	Times     HostTimes
}
type HostStatus struct {
	XMLName   xml.Name `xml:"status"`
	State     string   `xml:"state,attr"`
	Reason    string   `xml:"reason,attr"`
	ReasonTtl uint     `xml:"reason_ttl,attr"`
}

type HostAddress struct {
	Addr     string  `xml:"addr,attr"`
	AddrType string  `xml:"addrtype,attr"`
	Vendor   *string `xml:"vendor,attr"`
}
type HostTimes struct {
	XMLName xml.Name `xml:"times"`
	Srtt    uint     `xml:"srtt,attr"`
	RttVar  uint     `xml:"rttvar,attr"`
	To      uint     `xml:"to,attr"`
}

type RunStats struct {
	XMLName  xml.Name `xml:"runstats"`
	Finished RunStatsFinished
	Hosts    RunStatsHosts
}
type RunStatsFinished struct {
	XMLName xml.Name `xml:"finished"`
	Time    uint     `xml:"time,attr"`
	TimeStr string   `xml:"timestr,attr"`
	Summary string   `xml:"summary,attr"`
	Elapsed string   `xml:"elapsed,attr"`
	Exit    string   `xml:"exit,attr"`
}
type RunStatsHosts struct {
	XMLName xml.Name `xml:"hosts"`
	Up      uint     `xml:"up,attr"`
	Down    uint     `xml:"down,attr"`
	Total   uint     `xml:"total,attr"`
}

func Scan(dev string, network string) (*NmapRun, error) {
	tmp := filepath.Join(os.TempDir(), fmt.Sprintf("%s.xml", uuid.New().String()))
	{
		args := []string{"-e", dev, "-T4", "--max-retries", "2", "--host-timeout", "5m", "-oX", tmp, "-sn", network}
		slog.Info("scan", "dev", dev, "network", network, "file", tmp)
		slog.Debug("running", "args", strings.Join(args, " "))
		cmd := exec.Command("nmap", args...)
		if err := cmd.Run(); err != nil {
			return nil, err
		}
	}

	buf, err := os.ReadFile(tmp)
	if err != nil {
		return nil, err
	}
	var res NmapRun

	if err = xml.Unmarshal(buf, &res); err != nil {
		return nil, err
	}
	if err = os.Remove(tmp); err != nil {
		return nil, err
	}
	return &res, nil
}
