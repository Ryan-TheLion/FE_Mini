import * as S from './style'
import Button from '../../components/Button'
import Title from '../../components/Title'
import { Avatar, useTheme } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPayload, UserRole } from '../../types/user'
import { useEffect, useState } from 'react'
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form'
import TextField from '@mui/material/TextField'
import { AxiosError, HttpStatusCode } from 'axios'
import { MyInfoFormData, ModifyForm } from '../../api/type'
import { fetchUser } from '../../api/user'
import { modifyMyInfo } from '../../api/user'
import { instance } from '../../api/instance'
import { setUser, useAccessTokenInfo } from '../../store/slices/userSlice'

function EditProfile() {
  const theme = useTheme()
  const { user: userState, dispatch } = useAccessTokenInfo()
  const queryClient = useQueryClient()
  const { mutateAsync: modify } = useMutation(modifyMyInfo)
  const {
    register,
    getValues,
    setError,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MyInfoFormData>()

  const onSubmit: SubmitHandler<MyInfoFormData> = async ({
    name,
    fileName,
    email,
    phoneNumber,
    oldPassword,
    newPassword,
  }: MyInfoFormData) => {
    try {
      const { data: modifyResult } = await modify({
        name,
        fileName,
        email,
        oldPassword,
        newPassword,
        phoneNumber,
      } as ModifyForm)

      // if (fileName?.length >= 1) {
      //   console.log(1)
      // }
      if (modifyResult === true) {
        const { data: userResponse } = await instance.get('/api/v1/member/detail')

        const { username, name, fileName } = userResponse.data

        // @ts-ignore
        const payload: UserPayload = { ...userState.userPayload, username, name, image: fileName }

        dispatch(setUser(payload))
        queryClient.invalidateQueries(['user'])

        setIsShown((prev) => !prev)
        setIsClicked((prev) => !prev)
        // showAlarm()
      }
      if (user?.name) setValue('oldPassword', '')
      if (user?.email) setValue('newPassword', '')
      if (user?.phoneNumber) setValue('checkPassword', '')
      // window.location.reload()
    } catch (error) {
      if (error instanceof AxiosError) {
        const { response } = error

        if (
          response?.data.status === HttpStatusCode.BadRequest &&
          !response.request.responseURL.includes('/api/v1/temp/upload')
        ) {
          setError('oldPassword', {
            type: 'isNotCurrentPassword',
            message: '현재 비밀번호와 일치하지 않습니다. 다시 시도해주세요',
          })
        }
      }
    }
  }

  const onInvalid: SubmitErrorHandler<MyInfoFormData> = (error) => {
    console.log(error)
  }

  const { data: user, status } = useQuery(['user'], fetchUser)
  const [isShown, setIsShown] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [imagePreview, setImagePreview] = useState(user?.fileName)
  const image = watch('fileName')
  function handleClick() {
    setIsShown((prev) => !prev)
    setIsClicked((prev) => !prev)
  }
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, []) /* eslint-disable-line */

  // useEffect(() => {
  //   watch(({ phoneNumber }, { name }) => {
  //     if (name === 'phoneNumber' && phoneNumber) {
  //       if (phoneNumber.length === 3) {
  //         setValue('phoneNumber', phoneNumber + '-')
  //       }
  //       if (phoneNumber.length === 8) {
  //         setValue('phoneNumber', phoneNumber + '-')
  //       }
  //     }
  //   })
  // }, [watch])

  useEffect(() => {
    if (user?.name) setValue('name', user.name)
    if (user?.email) setValue('email', user.email)
    if (user?.phoneNumber) setValue('phoneNumber', user.phoneNumber)
  }, [setValue, user])

  useEffect(() => {
    if (image && image.length > 0) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      const file = image[0]

      setImagePreview(URL.createObjectURL(file))
    }
  }, [image]) /* eslint-disable-line */

  // const showAlarm = () => {
  //   alert('변경완료됐습니다')
  // }
  if (status === 'loading') return <></>
  if (status === 'error') return <>error</>

  return (
    <S.ProfilePage>
      <div
        style={{
          position: 'fixed',
          left: `calc(${theme.app.size.nav.width} + 40px)`,
          right: '40px',
          zIndex: '2',
          marginTop: '-40px',
          boxSizing: 'border-box',
          backgroundColor: '#fff',
          fontSize: theme.app.size.font.title,
        }}
      >
        <Title text="내 정보  수정" />
      </div>

      <S.ProfilesContainer>
        <S.ProfileContainer>
          <S.Authority>권한:{UserRole[user.role as keyof typeof UserRole]}</S.Authority>
          <Avatar alt="user-image" sx={{ width: 200, height: 200 }} src={user.fileName} />
          <S.UserDetailContainer>
            <S.Name>
              {user.name} <span>({user.username})</span>
            </S.Name>
            <S.Detail>{user.email}</S.Detail>
            <S.Detail>{user.phoneNumber}</S.Detail>
          </S.UserDetailContainer>
          <S.UserCompanyDetail>
            <S.Detail>사번:{user.employeeNumber}</S.Detail>
            <S.Detail>부서:{user.departmentName}</S.Detail>
            <S.Detail>직급:{user.positionName}</S.Detail>
            <S.Detail>
              입사일(근속연수):{user.joiningDay}({user.years}년)
            </S.Detail>
          </S.UserCompanyDetail>
          <S.ButtonWrapper>
            <Button disabled={isClicked} bg="#069C31" fontcolor="#fff" size="large" onClick={handleClick}>
              수정
            </Button>
          </S.ButtonWrapper>
        </S.ProfileContainer>

        {isShown && (
          <S.ProfileChangeContainer>
            <S.Authority>권한:{UserRole[user.role as keyof typeof UserRole]}</S.Authority>{' '}
            <Avatar alt="user-image" sx={{ width: 150, height: 150 }} src={imagePreview ?? user.fileName} />
            <form id="user-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
              <Button
                variant="contained"
                bg="#069C31"
                fontcolor="#fff"
                size="small"
                onClick={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  const input = Array.from(target.children).find(
                    (child) => child.tagName === 'INPUT',
                  ) as HTMLInputElement

                  input && input.click()
                }}
                style={{ position: 'absolute', right: '30%', top: '20%' }}
              >
                파일 선택
                <input type="file" hidden accept="image/*" {...register('fileName')} />
              </Button>
              <S.FormContainer>
                <S.Form>
                  {' '}
                  <S.InputWrapper>
                    <label htmlFor="name">이름</label>{' '}
                    <TextField
                      id="name"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      inputProps={{ style: { padding: '5px' } }}
                      placeholder="홍길동"
                      {...register('name', {
                        minLength: {
                          value: 2,
                          message: '이름은 2글자 이상 4글자 이하입니다.',
                        },
                        maxLength: {
                          value: 4,
                          message: '이름은 2글자 이상 4글자 이하입니다.',
                        },
                        pattern: {
                          value: /^[가-힣]*$/,
                          message: '한글만 입력가능합니다.',
                        },
                      })}
                    />
                    {errors?.name && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.name.message as string}</div>
                    )}
                  </S.InputWrapper>
                  <S.InputWrapper>
                    <label htmlFor="email">이메일</label>{' '}
                    <TextField
                      id="email"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      inputProps={{ style: { padding: '5px' } }}
                      placeholder="abc@console.log"
                      type="email"
                      {...register('email', {
                        pattern: {
                          value: /^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/,
                          message: '이메일 형식으로 기입해주세요.',
                        },
                      })}
                    />
                    {errors?.email && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.email.message as string}</div>
                    )}
                  </S.InputWrapper>
                  <S.InputWrapper>
                    <label htmlFor="phoneNumber">핸드폰번호</label>{' '}
                    <TextField
                      id="phoneNumber"
                      type="tel"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      placeholder="010-1234-1234"
                      inputProps={{ style: { padding: '5px' } }}
                      {...register('phoneNumber', {
                        pattern: {
                          value: /^010-[0-9]{4}-[0-9]{4}$/,
                          message: '010-1234-1234 형식으로 입력해주세요',
                        },
                      })}
                    />
                    {errors?.phoneNumber && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.phoneNumber.message as string}</div>
                    )}
                  </S.InputWrapper>
                </S.Form>
                <S.Form>
                  <S.InputWrapper>
                    <label htmlFor="oldPassword">현재 비밀번호</label>{' '}
                    <TextField
                      id="oldPassword"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      type="password"
                      inputProps={{ style: { padding: '5px' } }}
                      {...register('oldPassword', {
                        required: '현재 비밀번호를 입력해주세요',
                        pattern: {
                          value: /^[a-zA-Z0-9]{6,20}$/,
                          message: '비밀번호는 6~20자리의 숫자+영문 조합입니다',
                        },
                      })}
                    />
                    {errors?.oldPassword && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.oldPassword.message as string}</div>
                    )}
                  </S.InputWrapper>
                  <S.InputWrapper>
                    <label htmlFor="newPassword">새로운 비밀번호</label>{' '}
                    <TextField
                      id="newPassword"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      type="password"
                      inputProps={{ style: { padding: '5px' } }}
                      {...register('newPassword', {
                        required: '새로운 비밀번호를 입력해주세요',
                        pattern: {
                          value: /^[a-zA-Z0-9]{6,20}$/,
                          message: '비밀번호는 6~20자리의 숫자+영문 조합만 가능합니다',
                        },
                      })}
                    />
                    {errors?.newPassword && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.newPassword.message as string}</div>
                    )}
                  </S.InputWrapper>
                  <S.InputWrapper>
                    <label htmlFor="checkPassword">비밀번호 확인</label>{' '}
                    <TextField
                      id="checkPassword"
                      sx={{ backgroundColor: theme.app.palette.white }}
                      type="password"
                      inputProps={{ style: { padding: '5px' } }}
                      {...register('checkPassword', {
                        required: '비밀번호 확인은 필수 입력 사항입니다.',
                        validate: {
                          isEqualPassword: () => {
                            const { newPassword, checkPassword } = getValues()

                            return newPassword !== checkPassword ? '비밀번호가 일치하지 않습니다.' : true
                          },
                        },
                      })}
                    />
                    {errors?.checkPassword && (
                      <div style={{ color: 'red', fontSize: '10px' }}>{errors.checkPassword.message as string}</div>
                    )}
                  </S.InputWrapper>
                </S.Form>{' '}
              </S.FormContainer>
            </form>
            <S.Notice>아래 정보 수정은 관리자 권한입니다</S.Notice>
            <S.UserCompanyDetail>
              <S.Detail>사번:{user.employeeNumber}</S.Detail>
              <S.Detail>부서:{user.departmentName}</S.Detail>

              <S.Detail>직급:{user.positionName}</S.Detail>
              <S.Detail>
                입사일(근속연수):{user.startDate}({user.years}년)
              </S.Detail>
            </S.UserCompanyDetail>
            <S.ButtonWrapper>
              <Button variant="contained" bg="#069C31" fontcolor="#fff" size="large" type="submit" form="user-form">
                변경완료
              </Button>
            </S.ButtonWrapper>
          </S.ProfileChangeContainer>
        )}
      </S.ProfilesContainer>
    </S.ProfilePage>
  )
}
export default EditProfile
