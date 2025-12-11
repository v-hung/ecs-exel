import { useEffect, useState } from 'react'
import { Card, Button, Input, Space, Tag, Typography, Popconfirm, message } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useUsers } from '@renderer/features/attendance/hooks/users'
import { useAttendanceStore } from '@renderer/stores/attendanceStore'
import { useAttendanceSession } from '@renderer/contexts/AttendanceSessionContext'
import './style.css'
import { useNavigate } from 'react-router'

const { Text, Title } = Typography

export function Component() {
  const navigate = useNavigate()
  const {
    projects,
    initializeProjects,
    updateProjectName,
    setProjectEmployees,
    addNewProject,
    deleteProject
  } = useProjectStore()
  const { selectedEmployeeIds } = useAttendanceStore()
  const { startDate, endDate, setStep } = useAttendanceSession()
  const { users } = useUsers()

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!startDate || !endDate || !selectedEmployeeIds.length) {
      message.error('Thiếu thông tin!')
      navigate('/attendance')
      return
    }

    // Chỉ initialize 1 lần
    if (isInitialized) return

    initializeProjects()

    // Find unassigned employees (not in any project)
    const assignedIds = new Set<number>()
    projects.forEach((project) => {
      project.employeeIds.forEach((id) => assignedIds.add(id))
    })

    const unassignedIds = selectedEmployeeIds.filter((id) => !assignedIds.has(Number(id)))

    // Auto-assign unassigned employees to the first project
    if (unassignedIds.length > 0 && projects.length > 0) {
      const firstProject = projects[0]
      setProjectEmployees(firstProject.id, [...firstProject.employeeIds, ...unassignedIds])
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInitialized(true)
  }, [
    startDate,
    endDate,
    selectedEmployeeIds,
    navigate,
    isInitialized,
    initializeProjects,
    projects,
    setProjectEmployees
  ])

  const selectedUsers = users.filter((user) => selectedEmployeeIds.includes(user.id))

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return

    const sourceId = source.droppableId
    const destId = destination.droppableId

    if (sourceId === destId) return

    const employeeId = parseInt(result.draggableId)

    // Remove from source project
    const sourceProject = projects.find((p) => p.id === Number(sourceId))
    if (sourceProject) {
      setProjectEmployees(
        Number(sourceId),
        sourceProject.employeeIds.filter((id) => id !== employeeId)
      )
    }

    // Add to destination project
    const destProject = projects.find((p) => p.id === Number(destId))
    if (destProject) {
      setProjectEmployees(Number(destId), [...destProject.employeeIds, employeeId])
    }
  }

  const handleEditProject = (projectId: number, currentName: string) => {
    setEditingProjectId(projectId)
    setEditingName(currentName)
  }

  const handleSaveProjectName = (projectId: number) => {
    if (editingName.trim()) {
      updateProjectName(projectId, editingName.trim())
      setEditingProjectId(null)
      setEditingName('')
    }
  }

  const handleAddProject = () => {
    addNewProject(`Dự án #${projects.length + 1}`)
    message.success('Đã thêm dự án mới!')
  }

  const handleDeleteProject = (projectId: number) => {
    if (projects.length <= 5) {
      message.warning('Phải có ít nhất 5 dự án!')
      return
    }

    // No need to manually move employees to unassigned, it's auto-computed
    deleteProject(projectId)
    message.success('Đã xóa dự án!')
  }

  const handleNext = () => {
    setStep('preview')
    navigate('/attendance/preview')
  }

  return (
    <div className="project-assignment">
      <Card
        title={
          <Space>
            <ProjectOutlined />
            <span>Phân bổ nhân viên vào dự án</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attendance')}>
              Quay lại
            </Button>
            <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
              Tiếp tục
            </Button>
          </Space>
        }
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="project-container">
            {/* Projects */}
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="project-column">
                  <div className="column-header">
                    {editingProjectId === project.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onPressEnter={() => handleSaveProjectName(project.id)}
                        onBlur={() => handleSaveProjectName(project.id)}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      <Space>
                        <Title level={5}>{project.name}</Title>
                        <Tag color="blue">{project.employeeIds.length}</Tag>
                      </Space>
                    )}
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditProject(project.id, project.name)}
                      />
                      {projects.length > 5 && (
                        <Popconfirm
                          title="Xóa dự án này?"
                          onConfirm={() => handleDeleteProject(project.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      )}
                    </Space>
                  </div>

                  <Droppable droppableId={project.id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`employee-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      >
                        {project.employeeIds.length === 0 ? (
                          <div className="empty-placeholder">Kéo thả nhân viên vào đây</div>
                        ) : (
                          project.employeeIds.map((empId, index) => {
                            const user = selectedUsers.find((u) => u.id === empId)
                            if (!user) return null

                            return (
                              <Draggable key={empId} draggableId={empId.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`employee-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                  >
                                    <Text strong>{user.name}</Text>
                                    <Text type="secondary">{user.username}</Text>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}

              {/* Add project button */}
              <div className="project-column add-project-column">
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddProject}
                  style={{ width: '100%', minHeight: '100px' }}
                >
                  Thêm dự án mới
                </Button>
              </div>
            </div>
          </div>
        </DragDropContext>
      </Card>
    </div>
  )
}
