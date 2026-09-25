Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class FileLockFinder {
    [DllImport("rstrtmgr.dll", CharSet = CharSet.Auto)]
    public static extern int RmStartSession(out uint pSessionHandle, int dwSessionFlags, string strSessionKey);

    [DllImport("rstrtmgr.dll")]
    public static extern int RmEndSession(uint pSessionHandle);

    [DllImport("rstrtmgr.dll", CharSet = CharSet.Auto)]
    public static extern int RmRegisterResources(uint pSessionHandle, uint nFiles, string[] rgsFilenames, uint nApplications, IntPtr rgApplications, uint nServices, IntPtr rgsServiceNames);

    [DllImport("rstrtmgr.dll")]
    public static extern int RmGetList(uint pSessionHandle, out uint pnProcInfoNeeded, ref uint pnProcInfo, [In, Out] RM_PROCESS_INFO[] rgAffectedApps, ref uint lpdwRebootReasons);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct RM_PROCESS_INFO {
        public RM_UNIQUE_PROCESS Process;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string strAppName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
        public string strServiceShortName;
        public int ApplicationType;
        public uint AppStatus;
        public uint TSSessionId;
        [MarshalAs(UnmanagedType.Bool)]
        public bool bRestartable;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RM_UNIQUE_PROCESS {
        public int dwProcessId;
        public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime;
    }

    public static List<string> FindLockingProcesses(string path) {
        uint handle;
        string key = Guid.NewGuid().ToString();
        List<string> processes = new List<string>();
        int res = RmStartSession(out handle, 0, key);
        if (res != 0) return processes;
        try {
            string[] resources = new string[] { path };
            res = RmRegisterResources(handle, (uint)resources.Length, resources, 0, IntPtr.Zero, 0, IntPtr.Zero);
            if (res != 0) return processes;
            uint needed = 0;
            uint count = 0;
            uint reasons = 0;
            res = RmGetList(handle, out needed, ref count, null, ref reasons);
            if (res == 234) {
                RM_PROCESS_INFO[] infos = new RM_PROCESS_INFO[needed];
                count = needed;
                res = RmGetList(handle, out needed, ref count, infos, ref reasons);
                if (res == 0) {
                    for (int i = 0; i < count; i++) {
                        processes.Add(infos[i].Process.dwProcessId + ": " + infos[i].strAppName);
                    }
                }
            }
        } finally {
            RmEndSession(handle);
        }
        return processes;
    }
}
'@

$files = @(
    "C:\Users\IKTIAR RAMADANI\Documents\Projects\crud-map-geografis\.next\BUILD_ID",
    "C:\Users\IKTIAR RAMADANI\Documents\Projects\crud-map-geografis\.next\turbopack",
    "C:\Users\IKTIAR RAMADANI\Documents\Projects\crud-map-geografis\.next\build"
)

foreach ($f in $files) {
    Write-Host "Checking: $f"
    $procs = [FileLockFinder]::FindLockingProcesses($f)
    if ($procs.Count -gt 0) {
        Write-Host "Locked by: $($procs -join ', ')"
    } else {
        Write-Host "No process locking reported by RmRegisterResources"
    }
}
